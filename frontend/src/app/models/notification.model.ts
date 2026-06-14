export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string | any;
  type: 'message' | 'system' | 'grade' | 'purchase';
  relatedId?: string; // e.g., chat ID, activity ID
}
