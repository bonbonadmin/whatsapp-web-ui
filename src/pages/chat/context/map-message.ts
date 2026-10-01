import { Message, ToolApiItem } from "../chat-room-page/components/messages-list/data/get-messages";

const shortTs = (d: Date) => {
  const sameDay = new Date().toDateString() === d.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; // DD/MM
};
const fullTs = (d: Date) => {
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export function mapMessage(v: any): Message {
  const created = new Date(v.created_at);
  const contextMessageId =
    typeof v.context_message_id === "string" && v.context_message_id.trim()
      ? v.context_message_id.trim()
      : null;
  const quotedMessage = contextMessageId
    ? {
        id: v.quoted_message_row_id != null ? String(v.quoted_message_row_id) : undefined,
        messageId: v.quoted_message_id || contextMessageId,
        body: typeof v.quoted_message_text === "string" ? v.quoted_message_text : "",
        messageType: v.quoted_message_type ?? null,
        mediaLocation: v.quoted_media_location ?? null,
        fromMe: v.quoted_from_me ?? null,
        participantName: v.quoted_participant_name ?? v.quoted_participant_username ?? null,
        missing: !v.quoted_message_id,
      }
    : null;

  return {
    id: String(v.id),
    messageId: v.message_id ?? null,
    body: v.message_text,
    date: created.toLocaleDateString(),
    timestamp: shortTs(created),
    fullTimestamp: fullTs(created),
    messageStatus: v.participant_message_status,
    errors: v.errors ?? null,
    isOpponent: v.from_me === 0,
    messageType: v.message_type,
    templateMessageText: v.template_message_text ?? null,
    templateHeaderUrl: v.template_header_url ?? null,
    templateButtons: Array.isArray(v.template_buttons) ? v.template_buttons : [],
    mediaLocation: v.media_location,
    createdAtISO: created.toISOString(),
    contextMessageId,
    contextFrom: v.context_from ?? null,
    quotedMessage,
  };
}
export function mapTool(t: ToolApiItem): Message {
  const created = new Date(t.created_at);
  return {
    id: String(t.id),
    body: "", // rendered by ToolEventRow
    date: created.toLocaleDateString(),
    timestamp: shortTs(created),
    fullTimestamp: fullTs(created),
    messageStatus: "", // not applicable
    isOpponent: false,
    messageType: "tool",
    createdAtISO: created.toISOString(),
    functionName: t.function_name,
    functionArgs: t.function_args,
    chatResponseItem: t.chat_response_item,
    toolOutput: t.tool_output,
  };
}
