export type MessageStatus = "READ" | "DELIVERED" | "SENT";

export type Inbox = {
  id: string;
  name: string;
  image: string;
  updatedAt: string;
  participantId?: string;
  lastMessage?: string;
  timestamp?: string;
  messageStatus?: MessageStatus;
  notificationsCount?: number;
  isPinned?: boolean;
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
  created_at: Date;
  updated_at: string;
  unread_msg: number;
}
