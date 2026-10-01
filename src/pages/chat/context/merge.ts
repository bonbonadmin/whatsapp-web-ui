import { Inbox } from "common/types/common.type";
import { Message } from "../chat-room-page/components/messages-list/data/get-messages";

export function mergeInbox(previous: Inbox[], incoming: Inbox[]): Inbox[] {
  const rows = new Map(previous.map((row) => [`${row.waId}:${row.participantId}`, row]));
  incoming.forEach((row) => rows.set(`${row.waId}:${row.participantId}`, row));
  return Array.from(rows.values());
}

export function mergeMessages(previous: Message[], incoming: Message[]): Message[] {
  const rows = new Map(previous.map((row) => [row.id, row]));
  incoming.forEach((row) => rows.set(row.id, { ...rows.get(row.id), ...row }));
  return Array.from(rows.values()).sort(
    (a, b) =>
      String(a.createdAtISO).localeCompare(String(b.createdAtISO)) ||
      a.id.localeCompare(b.id, undefined, { numeric: true })
  );
}
