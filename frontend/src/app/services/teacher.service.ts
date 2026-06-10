import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Student, ClassRoom, AttendanceRecord, AttendanceSession,
  GradeRecord, StudentGradeSummary, AttendanceStatus
} from '../models/teacher.model';

@Injectable({ providedIn: 'root' })
export class TeacherService {

  // ── Mock Data ──────────────────────────────────────────────

  private students: Student[] = [
    { id: 's1', firstName: 'Sara', lastName: 'Ahmad', initials: 'SA', gradeLevel: '7th Grade', classId: 'c1', className: '7-A', venturePoints: 1820, gpa: 3.9 },
    { id: 's2', firstName: 'Ali', lastName: 'Omar', initials: 'AO', gradeLevel: '7th Grade', classId: 'c1', className: '7-A', venturePoints: 2450, gpa: 3.7 },
    { id: 's3', firstName: 'Mohamad', lastName: 'Awad', initials: 'MA', gradeLevel: '7th Grade', classId: 'c1', className: '7-A', venturePoints: 1600, gpa: 3.5 },
    { id: 's4', firstName: 'Rash', lastName: 'Khalid', initials: 'RK', gradeLevel: '7th Grade', classId: 'c1', className: '7-A', venturePoints: 980, gpa: 3.1 },
    { id: 's5', firstName: 'Rana', lastName: 'Zaid', initials: 'RZ', gradeLevel: '10th Grade', classId: 'c2', className: '10-B', venturePoints: 2100, gpa: 3.8 },
    { id: 's6', firstName: 'Lina', lastName: 'Hassan', initials: 'LH', gradeLevel: '10th Grade', classId: 'c2', className: '10-B', venturePoints: 1750, gpa: 3.6 },
  ];

  private classes: ClassRoom[] = [
    {
      id: 'c1', name: '7-A', gradeLevel: '7th Grade', homeroomTeacher: 'Mr. Khalid', teacherId: 't1', numberOfStudents: 4, subjects: [
        { id: 'sub1', name: 'Mathematics', teacherId: 't1', classId: 'c1' },
        { id: 'sub2', name: 'English', teacherId: 't1', classId: 'c1' },
        { id: 'sub3', name: 'Arabic', teacherId: 't1', classId: 'c1' },
        { id: 'sub4', name: 'Science', teacherId: 't1', classId: 'c1' },
        { id: 'sub5', name: 'History', teacherId: 't1', classId: 'c1' },
        { id: 'sub6', name: 'Art', teacherId: 't1', classId: 'c1' },
      ], schedule: 'Sun - Thu, 8:00 AM'
    },
    {
      id: 'c2', name: '10-B', gradeLevel: '10th Grade', homeroomTeacher: 'Ms. Sara', teacherId: 't1', numberOfStudents: 2, subjects: [
        { id: 'sub7', name: 'Mathematics', teacherId: 't1', classId: 'c2' },
        { id: 'sub8', name: 'Physics', teacherId: 't1', classId: 'c2' },
        { id: 'sub9', name: 'Chemistry', teacherId: 't1', classId: 'c2' },
        { id: 'sub10', name: 'Biology', teacherId: 't1', classId: 'c2' },
        { id: 'sub11', name: 'English', teacherId: 't1', classId: 'c2' },
        { id: 'sub12', name: 'Arabic', teacherId: 't1', classId: 'c2' },
        { id: 'sub13', name: 'History', teacherId: 't1', classId: 'c2' },
      ], schedule: 'Sun - Thu, 9:15 AM'
    },
  ];

  // Reactive attendance state
  private attendanceSubject = new BehaviorSubject<AttendanceRecord[]>([
    { studentId: 's1', studentName: 'Sara Ahmad', initials: 'SA', date: new Date().toISOString().split('T')[0], status: 'present', classId: 'c1', percentage: 97 },
    { studentId: 's2', studentName: 'Ali Omar', initials: 'AO', date: new Date().toISOString().split('T')[0], status: 'present', classId: 'c1', percentage: 95 },
    { studentId: 's3', studentName: 'Mohamad Awad', initials: 'MA', date: new Date().toISOString().split('T')[0], status: 'absent', classId: 'c1', percentage: 82 },
    { studentId: 's4', studentName: 'Rash Khalid', initials: 'RK', date: new Date().toISOString().split('T')[0], status: 'present', classId: 'c1', percentage: 90 },
  ]);

  // Reactive grades state
  private gradesSubject = new BehaviorSubject<GradeRecord[]>([
    { id: 'g1', studentId: 's1', studentName: 'Sara Ahmad', initials: 'SA', subject: 'Mathematics', activityTitle: 'Midterm Exam', activityType: 'exam', score: 95, maxScore: 100, date: '2025-05-10', classId: 'c1' },
    { id: 'g2', studentId: 's1', studentName: 'Sara Ahmad', initials: 'SA', subject: 'Mathematics', activityTitle: 'Chapter 3 Assignment', activityType: 'assignment', score: 89, maxScore: 100, date: '2025-05-15', classId: 'c1' },
    { id: 'g3', studentId: 's2', studentName: 'Ali Omar', initials: 'AO', subject: 'Mathematics', activityTitle: 'Midterm Exam', activityType: 'exam', score: 88, maxScore: 100, date: '2025-05-10', classId: 'c1' },
    { id: 'g4', studentId: 's2', studentName: 'Ali Omar', initials: 'AO', subject: 'English', activityTitle: 'Essay Assignment', activityType: 'assignment', score: 82, maxScore: 100, date: '2025-05-14', classId: 'c1' },
    { id: 'g5', studentId: 's3', studentName: 'Mohamad Awad', initials: 'MA', subject: 'Mathematics', activityTitle: 'Midterm Exam', activityType: 'exam', score: 74, maxScore: 100, date: '2025-05-10', classId: 'c1' },
    { id: 'g6', studentId: 's4', studentName: 'Rash Khalid', initials: 'RK', subject: 'Science', activityTitle: 'Lab Quiz', activityType: 'quiz', score: 80, maxScore: 100, date: '2025-05-12', classId: 'c1' },
  ]);

  // ── Public Methods ─────────────────────────────────────────

  getStudents(): Observable<Student[]> { return new Observable(o => { o.next(this.students); o.complete(); }); }
  getClasses(): Observable<ClassRoom[]> { return new Observable(o => { o.next(this.classes); o.complete(); }); }
  getAttendance(): Observable<AttendanceRecord[]> { return this.attendanceSubject.asObservable(); }
  getGrades(): Observable<GradeRecord[]> { return this.gradesSubject.asObservable(); }

  getStudentsByClass(classId: string): Student[] {
    return this.students.filter(s => s.classId === classId);
  }

  /** Save attendance (replaces existing for that class+date) */
  saveAttendance(records: AttendanceRecord[]): void {
    const current = this.attendanceSubject.value;
    const classId = records[0]?.classId;
    const date = records[0]?.date;
    const filtered = current.filter(r => !(r.classId === classId && r.date === date));
    this.attendanceSubject.next([...filtered, ...records]);
    // TODO: persist to Firestore: setDoc(doc(db,'attendance',`${classId}_${date}`), { records })
  }

  /** Add or update a grade record */
  saveGrade(grade: GradeRecord): void {
    const current = this.gradesSubject.value;
    const idx = current.findIndex(g => g.id === grade.id);
    if (idx >= 0) {
      const updated = [...current]; updated[idx] = grade;
      this.gradesSubject.next(updated);
    } else {
      this.gradesSubject.next([...current, { ...grade, id: 'g' + Date.now() }]);
    }
    // TODO: persist to Firestore: setDoc(doc(db,'grades', grade.id), grade)
  }

  deleteGrade(id: string): void {
    this.gradesSubject.next(this.gradesSubject.value.filter(g => g.id !== id));
  }

  /** Build per-student grade summary for a class */
  getGradeSummaryByClass(classId: string): StudentGradeSummary[] {
    const classStudents = this.students.filter(s => s.classId === classId);
    const classGrades = this.gradesSubject.value.filter(g => g.classId === classId);
    return classStudents.map(st => {
      const sg = classGrades.filter(g => g.studentId === st.id);
      const exams = sg.filter(g => g.activityType === 'exam');
      const assigns = sg.filter(g => g.activityType === 'assignment' || g.activityType === 'quiz');
      const avg = (arr: GradeRecord[]) => arr.length ? Math.round(arr.reduce((s, g) => s + g.score, 0) / arr.length) : 0;
      return {
        studentId: st.id, studentName: `${st.firstName} ${st.lastName}`,
        initials: st.initials, className: st.className,
        overallAverage: avg(sg), examAverage: avg(exams), assignmentAverage: avg(assigns),
        grades: sg
      };
    });
  }
}
