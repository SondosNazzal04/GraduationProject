import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, addDoc, getDoc, getDocs, Timestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string | any;
  isOwn?: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: string | any;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  get currentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }

  getMessages(chatId: string): Observable<Message[]> {
    return new Observable<Message[]>((observer) => {
      const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages: Message[] = snapshot.docs.map(docSnap => {
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
            senderId: data['senderId'],
            receiverId: data['receiverId'],
            content: data['content'],
            timestamp: timestampStr || new Date().toISOString(),
            isOwn: data['senderId'] === this.currentUserId
          } as Message;
        });
        observer.next(messages);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  async getUsers(): Promise<any[]> {
    const usersRef = collection(this.firestore, 'users');
    const snap = await getDocs(usersRef);
    return snap.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }));
  }

  async sendMessage(receiverId: string, content: string): Promise<void> {
    const senderId = this.currentUserId;
    if (!senderId) {
      console.warn('User not authenticated, using dummy ID for sending message (for testing)');
      // For testing with mock users when not logged in
    }
    
    // Fallback to 'me' if not authenticated so testing still works if no auth
    const actualSenderId = senderId || 'me';

    const chatId = this.getChatId(actualSenderId, receiverId);
    const chatRef = doc(this.firestore, `chats/${chatId}`);
    const messagesRef = collection(chatRef, 'messages');

    const chatSnap = await getDoc(chatRef);
    const now = serverTimestamp();
    
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants: [actualSenderId, receiverId],
        lastMessage: content,
        lastMessageTime: now,
        updatedAt: now
      });
    } else {
      await updateDoc(chatRef, {
        lastMessage: content,
        lastMessageTime: now,
        updatedAt: now
      });
    }

    await addDoc(messagesRef, {
      senderId: actualSenderId,
      receiverId,
      content,
      timestamp: now
    });
  }
}
