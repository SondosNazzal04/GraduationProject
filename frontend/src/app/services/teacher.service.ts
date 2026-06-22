import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Student, ClassRoom, AttendanceRecord, AttendanceSession,
  GradeRecord, StudentGradeSummary, AttendanceStatus
} from '../models/teacher.model';
import { getApiBaseUrl } from '../firebase.runtime-config';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private http = inject(HttpClient);
  private apiBaseUrl = getApiBaseUrl();

  private studentsSubject = new BehaviorSubject<Student[]>([]);
  private classesSubject = new BehaviorSubject<ClassRoom[]>([]);

  // Reactive attendance state
  private attendanceSubject = new BehaviorSubject<AttendanceRecord[]>([]);

  // Reactive grades state
  private gradesSubject = new BehaviorSubject<GradeRecord[]>([]);

  private hasLoaded = false;

  getStudents(): Observable<Student[]> {
    this.loadDataIfNeeded();
    return combineLatest([this.studentsSubject, this.classesSubject]).pipe(
      map(([students, classes]) => this.resolveClassNames(students, classes))
    );
  }

  getClasses(): Observable<ClassRoom[]> {
    this.loadDataIfNeeded();
    return this.classesSubject.asObservable();
  }

  getAttendance(): Observable<AttendanceRecord[]> {
    this.loadDataIfNeeded();
    return this.attendanceSubject.asObservable();
  }

  getGrades(): Observable<GradeRecord[]> {
    this.loadDataIfNeeded();
    return this.gradesSubject.asObservable();
  }

  private resolveClassNames(students: Student[], classes: ClassRoom[]): Student[] {
    return students.map(s => {
      const cls = classes.find(c => c.id === s.classId);
      return {
        ...s,
        className: cls ? cls.name : 'No Class'
      };
    });
  }

  private loadDataIfNeeded(): void {
    if (this.hasLoaded) return;
    this.hasLoaded = true;

    // Load classes
    firstValueFrom(this.http.get<any>(`${this.apiBaseUrl}/api/teacher/me/classes`)).then(res => {
      const dbClasses = res.items || [];
      const mappedClasses = dbClasses.map((c: any) => ({
        id: c.id,
        name: c.name || 'Unnamed Class',
        gradeLevel: c.gradeLevel || '7th Grade',
        homeroomTeacher: c.homeroomTeacher || 'Teacher',
        teacherId: c.teacherUid || '',
        numberOfStudents: c.studentUids?.length || 0,
        subjects: c.subjects || [
          { id: 'math', name: 'Mathematics', teacherId: c.teacherUid, classId: c.id },
          { id: 'sci', name: 'Science', teacherId: c.teacherUid, classId: c.id },
          { id: 'eng', name: 'English', teacherId: c.teacherUid, classId: c.id }
        ],
        schedule: c.code || 'Sun - Thu, 8:00 AM'
      }));
      this.classesSubject.next(mappedClasses);
    }).catch(err => {
      console.error('Failed to load teacher classes', err);
      this.hasLoaded = false;
    });

    // Load students
    firstValueFrom(this.http.get<any>(`${this.apiBaseUrl}/api/teacher/me/students`)).then(res => {
      const dbStudents = res.items || [];
      const mappedStudents = dbStudents.map((s: any) => {
        const first = s.firstName || '';
        const last = s.lastName || '';
        const init = (first[0] || '') + (last[0] || '');
        return {
          id: s.uid,
          firstName: first,
          lastName: last,
          initials: init.toUpperCase() || 'ST',
          gradeLevel: s.profile?.gradeLevel || '7th Grade',
          classId: (s.classIds && s.classIds[0]) || '',
          className: '',
          venturePoints: s.pointsBalance || 0,
          gpa: s.profile?.gpa || 3.5,
          email: s.email
        };
      });
      this.studentsSubject.next(mappedStudents);
    }).catch(err => {
      console.error('Failed to load teacher students', err);
      this.hasLoaded = false;
    });

    // Load grades
    firstValueFrom(this.http.get<any>(`${this.apiBaseUrl}/api/teacher/grades`)).then(res => {
      const dbGrades = res.items || [];
      this.gradesSubject.next(dbGrades);
    }).catch(err => console.error('Failed to load teacher grades', err));

    // Load attendance
    firstValueFrom(this.http.get<any>(`${this.apiBaseUrl}/api/teacher/attendance`)).then(res => {
      const dbAttendance = res.items || [];
      this.attendanceSubject.next(dbAttendance);
    }).catch(err => console.error('Failed to load teacher attendance', err));
  }

  getStudentsByClass(classId: string): Student[] {
    const students = this.studentsSubject.value;
    const classes = this.classesSubject.value;
    return this.resolveClassNames(students, classes).filter(s => s.classId === classId);
  }

  /** Save attendance (replaces existing for that class+date) */
  saveAttendance(records: AttendanceRecord[]): void {
    this.http.post<any>(`${this.apiBaseUrl}/api/teacher/attendance`, records).subscribe({
      next: (res) => {
        const savedRecords = res.items || records;
        const current = this.attendanceSubject.value;
        const classId = records[0]?.classId;
        const date    = records[0]?.date;
        const filtered = current.filter(r => !(r.classId === classId && r.date === date));
        this.attendanceSubject.next([...filtered, ...savedRecords]);
      },
      error: (err) => console.error('Failed to save attendance', err)
    });
  }

  /** Add or update a grade record */
  saveGrade(grade: GradeRecord): void {
    this.http.post<any>(`${this.apiBaseUrl}/api/teacher/grades`, grade).subscribe({
      next: (res) => {
        const savedGrade = res.item;
        const current = this.gradesSubject.value;
        const idx = current.findIndex(g => g.id === savedGrade.id || g.id === grade.id);
        if (idx >= 0) {
          const updated = [...current];
          updated[idx] = savedGrade;
          this.gradesSubject.next(updated);
        } else {
          this.gradesSubject.next([...current, savedGrade]);
        }
      },
      error: (err) => console.error('Failed to save grade', err)
    });
  }

  deleteGrade(id: string): void {
    if (id && !id.startsWith('g')) {
      this.http.delete(`${this.apiBaseUrl}/api/teacher/grades/${id}`).subscribe({
        next: () => this.gradesSubject.next(this.gradesSubject.value.filter(g => g.id !== id)),
        error: (err) => console.error('Failed to delete grade', err)
      });
    } else {
      this.gradesSubject.next(this.gradesSubject.value.filter(g => g.id !== id));
    }
  }

  /** Build per-student grade summary for a class */
  getGradeSummaryByClass(classId: string): StudentGradeSummary[] {
    const classStudents = this.getStudentsByClass(classId);
    const classGrades   = this.gradesSubject.value.filter(g => g.classId === classId);
    return classStudents.map(st => {
      const sg = classGrades.filter(g => g.studentId === st.id);
      const exams  = sg.filter(g => g.activityType === 'exam');
      const assigns = sg.filter(g => g.activityType === 'assignment' || g.activityType === 'quiz');
      const avg = (arr: GradeRecord[]) => arr.length ? Math.round(arr.reduce((s,g)=>s+g.score,0)/arr.length) : 0;
      return {
        studentId: st.id, studentName: `${st.firstName} ${st.lastName}`,
        initials: st.initials, className: st.className,
        overallAverage: avg(sg), examAverage: avg(exams), assignmentAverage: avg(assigns),
        grades: sg
      };
    });
  }
}
