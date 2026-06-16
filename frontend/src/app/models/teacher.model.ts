// ============================================================
// EduVenture - Teacher / Student / Attendance / Grades Models
// ============================================================

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  gradeLevel: string;
  classId: string;
  className: string;
  venturePoints: number;
  gpa: number;
  email?: string;
  parentId?: string;
}

export interface ClassRoom {
  id: string;
  name: string;          // e.g. "7-A"
  gradeLevel: string;    // e.g. "7th Grade"
  homeroomTeacher: string;
  teacherId: string;
  numberOfStudents: number;
  subjects: Subject[];
  schedule: string;      // e.g. "Sun - Thu, 8:00 AM"
}

export interface Subject {
  id: string;
  name: string;          // e.g. "Mathematics"
  teacherId: string;
  classId: string;
}

// Attendance
export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  initials: string;
  date: string;          // ISO date string
  status: AttendanceStatus;
  classId: string;
  percentage: number;    // cumulative attendance %
}

export interface AttendanceSession {
  classId: string;
  className: string;
  date: string;
  records: AttendanceRecord[];
}

// Grades
export type ActivityType = 'exam' | 'assignment' | 'quiz';

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  initials: string;
  subject: string;
  activityTitle: string;
  activityType: ActivityType;
  score: number;          // 0-100
  maxScore: number;       // default 100
  date: string;
  classId: string;
}

export interface StudentGradeSummary {
  studentId: string;
  studentName: string;
  initials: string;
  className: string;
  overallAverage: number;
  examAverage: number;
  assignmentAverage: number;
  grades: GradeRecord[];
}
