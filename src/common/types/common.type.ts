export type MessageStatus = "failed" | "delivered" | "sent" | 'read';

export type EventSummary = {
  event_name: string;
  started_at: string; // ISO string
};

export type Booking = {
  booking_id: string;
  booking_event_id: string;
  event_name: string;
  started_at: string;
  designation: string;
  name: string;
  pax: number | null;
  template_id: number | null;
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
  lastMessageStatus?: MessageStatus;
  fromMe?: number;
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
  last_message_status?: MessageStatus | string | null;
  display_phone_number: string;
  is_pinned?: boolean;
  pinned_at?: string | null;
  created_at: Date;
  updated_at: string;
  unread_msg: number;
}
