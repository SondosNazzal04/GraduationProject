import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, addDoc, getDocs, writeBatch, where } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, BehaviorSubject } from 'rxjs';
import { Notification } from '../../../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  get currentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  getNotifications(userId: string): Observable<Notification[]> {
    return new Observable<Notification[]>((observer) => {
      const notificationsRef = collection(this.firestore, `users/${userId}/notifications`);
      const q = query(notificationsRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          let ts = data['timestamp'];
          let timestampStr = '';

          if (ts && typeof ts.toDate === 'function') {
            timestampStr = ts.toDate().toISOString();
          } else if (ts) {
            timestampStr = new Date(ts).toISOString();
          }

          return {
            id: docSnap.id,
            userId: data['userId'],
            title: data['title'],
            message: data['message'],
            isRead: data['isRead'] || false,
            timestamp: timestampStr || new Date().toISOString(),
            type: data['type'],
            relatedId: data['relatedId']
          } as Notification;
        });
        observer.next(notifications);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  async sendNotification(receiverId: string, notificationData: Partial<Notification>): Promise<void> {
    const notificationsRef = collection(this.firestore, `users/${receiverId}/notifications`);
    const now = serverTimestamp();

    await addDoc(notificationsRef, {
      ...notificationData,
      userId: receiverId,
      isRead: false,
      timestamp: now
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notificationRef = doc(this.firestore, `users/${userId}/notifications/${notificationId}`);
    await updateDoc(notificationRef, {
      isRead: true
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notificationsRef = collection(this.firestore, `users/${userId}/notifications`);
    const q = query(notificationsRef, where('isRead', '==', false));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(this.firestore);
    querySnapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, { isRead: true });
    });

    await batch.commit();
  }
}
