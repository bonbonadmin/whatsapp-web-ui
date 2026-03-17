export type MessageStatus = "failed" | "delivered" | "sent" | 'read';

export type EventSummary = {
  event_name: string;
  started_at: string; // ISO string
};

export type RecentOrder = {
  orderId: string;
  orderDate: string | null;
  paymentStatus: string | null;
  shipmentStatus: string | null;
  trackingCode: string | null;
};

export type Inbox = {
  id: string;
  name: string;
  image: string;
  updatedAt: string;
  participantId: string;
  lastMessage?: string;
  timestamp?: string;
  messageStatus?: string;
  notificationsCount?: number;
  isPinned?: boolean;
  pinnedAt?: string | null;
  isOnline?: boolean;
};

export type InboxResponse = {
  id: string;
  message_id: string;
  participant_id: string;
  participant_name: string;
  from_me: number;
  message_text: string;
  message_status: number;
  display_phone_number: string;
  is_pinned?: boolean;
  pinned_at?: string | null;
  created_at: Date;
  updated_at: string;
  unread_msg: number;
}
