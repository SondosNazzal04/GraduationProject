import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Child } from '../models/child.model';

/**
 * ChildService
 * Currently returns mock data matching the GP documentation examples.
 * TODO: Replace mock data with real Firestore calls:
 *   - import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
 *   - Query: students where parentId == currentUser.uid
 *   - Join with: grades, attendance, classes, learningSummary, achievements collections
 */
@Injectable({
  providedIn: 'root'
})
export class ChildService {

  private mockChildren: Child[] = [
    {
      id: 'student_001',
      firstName: 'Rama',
      lastName: 'Omar',
      initials: 'RO',
      gradeLevel: '7th Grade',
      venturePoints: 1820,
      currentStreak: 3,
      gpa: 3.9,
      attendance: {
        percentage: 98,
        presentDays: 45,
        absentDays: 1
        // TODO: fetch from Firestore attendance collection
      },
      grades: {
        overallAverage: 92,
        latestExamScore: 95,
        latestAssignmentScore: 89
        // TODO: fetch from Firestore grades collection
      },
      classInfo: {
        className: '7-A',
        numberOfSubjects: 6,
        homeroomTeacher: 'Ahmad Ali'
        // TODO: fetch from Firestore classes collection
      },
      learningSummary: {
        assignmentsCompleted: 18,
        assignmentsPending: 3,
        achievementsEarned: 5,
        monthlyVenturePoints: 420
        // TODO: fetch from Firestore learningSummary collection
      },
      achievements: {
        totalBadges: 8,
        totalAchievements: 12
        // TODO: fetch from Firestore achievements collection
      },
      teacherId: 'teacher_001'
    },
    {
      id: 'student_002',
      firstName: 'Ali',
      lastName: 'Omar',
      initials: 'AO',
      gradeLevel: '10th Grade',
      venturePoints: 2450,
      currentStreak: 5,
      gpa: 3.7,
      attendance: {
        percentage: 95,
        presentDays: 43,
        absentDays: 3
        // TODO: fetch from Firestore attendance collection
      },
      grades: {
        overallAverage: 88,
        latestExamScore: 91,
        latestAssignmentScore: 85
        // TODO: fetch from Firestore grades collection
      },
      classInfo: {
        className: '10-B',
        numberOfSubjects: 7,
        homeroomTeacher: 'Sara Khalid'
        // TODO: fetch from Firestore classes collection
      },
      learningSummary: {
        assignmentsCompleted: 22,
        assignmentsPending: 2,
        achievementsEarned: 7,
        monthlyVenturePoints: 580
        // TODO: fetch from Firestore learningSummary collection
      },
      achievements: {
        totalBadges: 11,
        totalAchievements: 15
        // TODO: fetch from Firestore achievements collection
      },
      teacherId: 'teacher_002'
    }
  ];

  /**
   * Returns the list of children linked to the currently logged-in parent.
   * TODO: Replace with Firestore query:
   *   const parentId = this.auth.currentUser?.uid;
   *   const q = query(collection(db, 'students'), where('parentId', '==', parentId));
   */
  getChildren(): Observable<Child[]> {
    return of(this.mockChildren);
  }

  /**
   * Navigates to the messaging page pre-filled with the teacher's contact.
   * TODO: integrate with messages module using teacherId
   */
  contactTeacher(teacherId: string | undefined): void {
    // TODO: this.router.navigate(['/parent/messages'], { queryParams: { recipientId: teacherId } });
    console.log('Contact teacher:', teacherId);
  }
}
