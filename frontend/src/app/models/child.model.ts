// ============================================================
// EduVenture - Child / Student Interfaces
// All interfaces follow the class diagram in the GP document.
// Fields marked TODO require backend / Firebase integration.
// ============================================================

export interface AttendanceDetails {
  percentage: number;      // e.g. 98
  presentDays: number;     // e.g. 45
  absentDays: number;      // e.g. 2
  // TODO: fetch from Firestore collection: attendance/{studentId}
}

export interface GradesInfo {
  overallAverage: number;  // e.g. 92  (percentage)
  latestExamScore: number; // e.g. 95
  latestAssignmentScore: number; // e.g. 89
  // TODO: fetch from Firestore collection: grades/{studentId}
}

export interface ClassInfo {
  className: string;       // e.g. "7-A"
  numberOfSubjects: number;// e.g. 6
  homeroomTeacher: string; // e.g. "Ahmad Ali"
  // TODO: fetch from Firestore collection: classes/{classId}
}

export interface LearningSummary {
  assignmentsCompleted: number;  // e.g. 18
  assignmentsPending: number;    // e.g. 3
  achievementsEarned: number;    // e.g. 5
  monthlyVenturePoints: number;  // e.g. 420
  // TODO: fetch from Firestore collection: learningSummary/{studentId}
}

export interface AchievementsSummary {
  totalBadges: number;       // e.g. 8
  totalAchievements: number; // e.g. 12
  // TODO: fetch from Firestore collection: achievements/{studentId}
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;          // derived: first letter of first + last name
  gradeLevel: string;        // e.g. "7th Grade"
  venturePoints: number;
  currentStreak: number;     // in days
  attendance: AttendanceDetails;
  gpa: number;               // e.g. 3.9
  grades: GradesInfo;
  classInfo: ClassInfo;
  learningSummary: LearningSummary;
  achievements: AchievementsSummary;
  teacherId?: string;        // for "Contact Teacher" button
  // TODO: link to Firestore document: students/{studentId}
}
