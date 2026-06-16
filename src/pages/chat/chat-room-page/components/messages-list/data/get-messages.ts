import { MessageStatus } from "common/types/common.type";
import { useEffect } from "react";

export type Message = {
  id: string;
  body: string;
  date: string;
  timestamp: string;
  messageStatus: string;
  isOpponent: boolean;
  messageType?: string;
  mediaLocation?: string;
  fullTimestamp?: string;
  functionName?: string;
  functionArgs?: string | null;
  chatResponseItem?: any;
  toolOutput?: any;
  participantMessageStatus?: string | null;
  errors?: Array<{
    title?: string;
    message?: string;
    code?: number;
    error_data?: any;
  }> | null;
  createdAtISO?: string;
  contextMessageId?: string | null;
  contextFrom?: string | null;
  quotedMessage?: QuotedMessage | null;
};

export type QuotedMessage = {
  id?: string;
  messageId: string;
  body: string;
  messageType?: string | null;
  mediaLocation?: string | null;
  fromMe?: number | null;
  participantName?: string | null;
  missing?: boolean;
};

export type MessageResponse = {
  id: string;
  message_id: string;
  participant_id: string;
  participant_name: string;
  from_me: number;
  message_text: string;
  message_type: string;
  media_location: string;
  message_status: number;
  participant_message_status: string;
  display_phone_number: string;
  context_message_id?: string | null;
  context_from?: string | null;
  context?: any;
  quoted_message_row_id?: string | number | null;
  quoted_message_id?: string | null;
  quoted_message_text?: string | null;
  quoted_message_type?: string | null;
  quoted_media_location?: string | null;
  quoted_from_me?: number | null;
  quoted_participant_name?: string | null;
  quoted_participant_username?: string | null;
  created_at: Date;
};

export type ToolApiItem = {
  id: string;                     // e.g. "tool-<tools.id>-<tool_call_id>"
  tools_row_id: number;
  created_at: string;
  updated_at: string;
  message_type: 'tool';
  function_name: string;
  function_args: string | null;
  chat_response_item?: any;       // raw OpenAI tool item
  tool_output?: any;              // matched output by tool_call_id
  status?: string | null;
};

export type MessageTextPayload = {
  to?: string;
  textMessage?: string;
  mediaType?: string;
  nonManual?: boolean;
};

export type MessagePayload = {
  to?: string;
  textMessage?: string;
  mediaType?: string;
  mediaId?: string;
  filePath?: string;
  nonManual?: boolean;
};

const messages: Message[] = [
  {
    id: "1",
    body: "Can you send me that file?",
    date: "19/02/2023",
    timestamp: "08:58",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "2",
    body: "sure.",
    date: "20/02/2023",
    timestamp: "09:01",
    messageStatus: "READ",
    isOpponent: false,
  },
  {
    id: "3",
    body: "Yet another message here..",
    date: "20/02/2023",
    timestamp: "09:05",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "4",
    body: "What time should we meet?",
    date: "20/02/2023",
    timestamp: "12:30",
    messageStatus: "READ",
    isOpponent: false,
  },
  {
    id: "5",
    body: "Can you send me that file?",
    date: "21/02/2023",
    timestamp: "15:42",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "6",
    body: "I'll be there in 10 minutes.",
    date: "22/02/2023",
    timestamp: "10:12",
    messageStatus: "READ",
    isOpponent: false,
  },
  {
    id: "7",
    body: "Let's meet at the coffee shop.",
    date: "23/02/2023",
    timestamp: "18:03",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "8",
    body: "Sorry, I can't make it today.",
    date: "24/02/2023",
    timestamp: "13:25",
    messageStatus: "READ",
    isOpponent: false,
  },
  {
    id: "9",
    body: "No problem, we can reschedule.",
    date: "25/02/2023",
    timestamp: "16:08",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "10",
    body: "Do you have any suggestions for dinner?",
    date: "26/02/2023",
    timestamp: "20:12",
    messageStatus: "READ",
    isOpponent: false,
  },
  {
    id: "11",
    body: "How about that new Italian place?",
    date: "27/02/2023",
    timestamp: "09:52",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "12",
    body: "Sounds good to me.",
    date: "28/02/2023",
    timestamp: "14:27",
    messageStatus: "READ",
    isOpponent: false,
  },
  {
    id: "13",
    body: "Glad to hear that!",
    date: "28/02/2023",
    timestamp: "14:30",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "14",
    body: "What time works for you?",
    date: "01/03/2023",
    timestamp: "11:45",
    messageStatus: "READ",
    isOpponent: false,
  },
  {
    id: "15",
    body: "How about 2pm?",
    date: "01/03/2023",
    timestamp: "11:47",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "16",
    body: "2pm works great for me!",
    date: "01/03/2023",
    timestamp: "11:50",
    messageStatus: "READ",
    isOpponent: false,
  },
  {
    id: "17",
    body: "See you then!",
    date: "01/03/2023",
    timestamp: "11:55",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "18",
    body: "Hey, what's up?",
    date: "02/03/2023",
    timestamp: "16:35",
    messageStatus: "READ",
    isOpponent: false,
  },
  {
    id: "19",
    body: "Not much, how about you?",
    date: "02/03/2023",
    timestamp: "16:40",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "20",
    body: "Just hanging out at home.",
    date: "02/03/2023",
    timestamp: "16:42",
    messageStatus: "READ",
    isOpponent: false,
  },
  {
    id: "21",
    body: "Sounds nice. Any plans for the weekend?",
    date: "03/03/2023",
    timestamp: "09:20",
    messageStatus: "READ",
    isOpponent: true,
  },
  {
    id: "22",
    body: "Not yet, do you have any suggestions?",
    date: "03/03/2023",
    timestamp: "09:23",
    messageStatus: "DELIVERED",
    isOpponent: false,
  },
];

export function getMessages(id?: string): Message[] {
  const totalMessagesLength = messages.length;
  let randomNumber = Math.floor(Math.random() * totalMessagesLength);

  if (randomNumber > totalMessagesLength) randomNumber = totalMessagesLength;
  if (randomNumber === 1) randomNumber = 2; // so we always have atleast 1-2 messages.

  return messages.slice(0, randomNumber);
}
