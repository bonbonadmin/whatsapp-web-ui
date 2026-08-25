// /pages/chat/context/chat.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import { inbox as demoInbox } from "../data/inbox";
import { Booking, Inbox, InboxResponse } from "common/types/common.type";
import {
  getMessages,
  Message,
  MessagePayload,
  MessageResponse,
  ToolApiItem,
} from "../chat-room-page/components/messages-list/data/get-messages";

type BookingEvent = { event_name: string; started_at: string };

export type ManualState = {
  participantId: string;
  waId?: string;
  hasThread: boolean;
  manual: boolean;
  timeManual: string | null;
  manualExpiresAt: string | null;
  manualWindowHours: number;
};

type User = { name: string; image: string };

type SearchResult = Inbox | Message;

type ChatContextProp = {
  user: User;
  inbox: Inbox[];
  participantMessages: Message[];
  firstOpenChat: boolean;
  activeChat?: Inbox;
  searchText: string;
  searchResults: SearchResult[];
  hasMore: boolean;
  replyTarget?: Message | null;
  onChangeChat: (chat: Inbox) => void;
  onFirstOpenChat: (condition: boolean) => void;
  onSendMessage: (message: MessagePayload) => void;
  onUploadFile: (
    file: File,
    msg: string,
    type: string,
    nonManual: boolean,
    contextMessageId?: string | null
  ) => void;
  onReplyToMessage: (message: Message) => void;
  onClearReplyTarget: () => void;
  onSearch: (query: string) => void;
  onToggleSearch: (toggle: boolean) => void;
  loadMore: () => void;
  isFetchInbox: boolean;
  bookingEvents?: BookingEvent[];
  bookings?: Booking[];
  reloadMessages: (days?: number) => void;
  manualState?: ManualState;
  isTogglingManual: boolean;
  onToggleManual: (next: boolean) => void;
};

const initialValue: ChatContextProp = {
  user: { name: "Jazim Abbas", image: "/assets/images/girl.jpeg" },
  inbox: demoInbox,
  participantMessages: getMessages(),
  firstOpenChat: false,
  searchText: "",
  searchResults: [],
  hasMore: true,
  replyTarget: null,
  isFetchInbox: false,
  bookingEvents: undefined,
  bookings: undefined,
  manualState: undefined,
  isTogglingManual: false,
  onToggleManual() {
    throw new Error();
  },
  onChangeChat() {
    throw new Error();
  },
  onSendMessage() {
    throw new Error();
  },
  onUploadFile() {
    throw new Error();
  },
  onReplyToMessage() {
    throw new Error();
  },
  onClearReplyTarget() {
    throw new Error();
  },
  onFirstOpenChat() {
    throw new Error();
  },
  onSearch() {
    throw new Error();
  },
  onToggleSearch() {
    throw new Error();
  },
  loadMore() {
    throw new Error("loadMore function must be overridden");
  },
  reloadMessages() {
    throw new Error();
  },
};

const LS_ACTIVE_CHAT = "chat:activeParticipantId";
const LS_ACTIVE_CHAT_WA_ID = "chat:activeWaId";
export const ALL_WA_IDS = "__all__";

type StoredWaLine = { id: string };

const getSelectedWaIds = (): string[] => {
  const selected = localStorage.getItem("wa:selectedId") || "";
  if (selected && selected !== ALL_WA_IDS) return [selected];
  if (selected !== ALL_WA_IDS) return [];

  try {
    const lines = JSON.parse(localStorage.getItem("wa:ids") || "[]") as StoredWaLine[];
    return Array.isArray(lines) ? lines.map((line) => line?.id).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const fmtTs = (d: Date) => {
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const ChatContext = React.createContext<ChatContextProp>(initialValue);

export default function ChatProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User>(initialValue.user);
  const [inbox, setInbox] = useState<Inbox[]>([]);
  const [activeChat, setActiveChat] = useState<Inbox>();
  const [participantMessages, setMessages] = useState<Message[]>([]);
  const [firstOpenChat, setFirstOpenChat] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [searchText, setSearchText] = useState<string>("");
  const [toggleSearch, setToggleSearch] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchResults] = useState<SearchResult[]>([]);
  const [isFetchInbox, setIsFetchInbox] = useState<boolean>(false);
  const [bookingEvents, setBookingEvents] = useState<BookingEvent[] | undefined>(undefined);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [bookings, setBookings] = useState<Booking[] | undefined>(undefined);
  const [manualState, setManualState] = useState<ManualState | undefined>(undefined);
  const [isTogglingManual, setIsTogglingManual] = useState<boolean>(false);

  const baseURL = process.env.REACT_APP_API_URL;

  const activeChatRef = useRef(activeChat);
  const lastUpdateRef = useRef(lastUpdate);
  const toggleSearchRef = useRef(toggleSearch);
  const isFetchInboxRef = useRef(isFetchInbox);
  const didRestoreActiveRef = useRef(false);
  const messageRequestRef = useRef(0);
  const inboxRequestRef = useRef(0);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);
  useEffect(() => {
    lastUpdateRef.current = lastUpdate;
  }, [lastUpdate]);
  useEffect(() => {
    toggleSearchRef.current = toggleSearch;
  }, [toggleSearch]);
  useEffect(() => {
    isFetchInboxRef.current = isFetchInbox;
  }, [isFetchInbox]);

  // Seed default WA header from storage on mount
  useEffect(() => {
    const storedId = localStorage.getItem("wa:selectedId") || "";
    if (storedId && storedId !== ALL_WA_IDS) axios.defaults.headers.common["x-wa-id"] = storedId;
    else delete axios.defaults.headers.common["x-wa-id"];
  }, []);

  const fetchMessages = useCallback(
    async (id: string, days: number = 365, sourceWaId?: string) => {
      if (!id) return;
      const requestId = ++messageRequestRef.current;
      try {
        const selectedWaId = localStorage.getItem("wa:selectedId") || "";
        const waId = sourceWaId || (selectedWaId === ALL_WA_IDS ? "" : selectedWaId);
        const headers: Record<string, string> = {};
        if (waId) headers["x-wa-id"] = waId;

        const { data } = await axios.get(`${baseURL}/message-inbox/${encodeURIComponent(id)}`, {
          params: { days },
          headers,
        });

        const rawBookings = Array.isArray(data?.bookings)
          ? data.bookings
          : Array.isArray(data?.bookingEvents)
          ? data.bookingEvents
          : [];
        const nextBookings: Booking[] = rawBookings
          .map((e: any) => ({
            booking_id: String(e?.booking_id ?? ""),
            booking_event_id: String(e?.booking_event_id ?? ""),
            event_name: e?.event_name ?? e?.booking_event_name ?? "",
            started_at: e?.started_at ?? "",
            designation: e?.designation ?? "",
            name: e?.name ?? "",
            pax: e?.pax == null ? null : Number(e.pax),
            template_id: e?.template_id == null ? null : Number(e.template_id),
          }))
          .filter((e: Booking) => e.booking_id);
        const events: BookingEvent[] = nextBookings
          .map(({ event_name, started_at }) => ({ event_name, started_at }))
          .filter((event) => event.event_name && event.started_at);

        if (requestId !== messageRequestRef.current) return;
        setBookings(nextBookings.length ? nextBookings : undefined);
        setBookingEvents(events.length ? events : undefined);

        // ===== helpers for timestamps =====
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

        // ===== messages -> UI =====
        const rows: any[] = Array.isArray(data?.data) ? data.data : [];
        // const rows: MessageResponse[] = Array.isArray(data?.data) ? data.data : [];
        const msgList: Message[] = rows.map((v) => {
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
            mediaLocation: v.media_location,
            createdAtISO: created.toISOString(),
            contextMessageId,
            contextFrom: v.context_from ?? null,
            quotedMessage,
          };
        });

        // ===== tools -> UI (no bubble) =====
        const toolRows: ToolApiItem[] = Array.isArray(data?.tools) ? data.tools : [];
        const toolList: Message[] = toolRows.map((t) => {
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
        });

        // ===== merge + sort by time =====
        const merged = [...msgList, ...toolList].sort((a, b) =>
          String(a.createdAtISO).localeCompare(String(b.createdAtISO))
        );

        if (requestId === messageRequestRef.current) {
          setMessages(merged);
        }
      } catch (error) {
        if (requestId === messageRequestRef.current) {
          setBookings(undefined);
          setBookingEvents(undefined);
        }
        console.error("Error fetching messages list:", error);
      }
    },
    [baseURL]
  );

  // ===== manual (human takeover) toggle =====
  const manualRequestRef = useRef(0);

  const toManualState = useCallback(
    (participantId: string, payload: any, waId?: string): ManualState => ({
      participantId,
      waId,
      hasThread: !!payload?.has_thread,
      manual: Number(payload?.manual) === 1,
      timeManual: payload?.time_manual ?? null,
      manualExpiresAt: payload?.manual_expires_at ?? null,
      manualWindowHours: Number(payload?.manual_window_hours) || 3,
    }),
    []
  );

  const fetchManual = useCallback(
    async (participantId: string, sourceWaId?: string) => {
      if (!participantId) return;
      const requestId = ++manualRequestRef.current;
      try {
        const selectedWaId = localStorage.getItem("wa:selectedId") || "";
        const waId = sourceWaId || (selectedWaId === ALL_WA_IDS ? "" : selectedWaId);
        const headers: Record<string, string> = {};
        if (waId) headers["x-wa-id"] = waId;

        const { data } = await axios.get(
          `${baseURL}/message-inbox/${encodeURIComponent(participantId)}/manual`,
          { headers }
        );

        if (requestId !== manualRequestRef.current) return;
        setManualState(toManualState(participantId, data?.data, waId));
      } catch (error) {
        if (requestId === manualRequestRef.current) setManualState(undefined);
        console.error("Error fetching manual state:", error);
      }
    },
    [baseURL, toManualState]
  );

  const handleToggleManual = useCallback(
    async (next: boolean) => {
      const participantId = activeChatRef.current?.participantId;
      const sourceWaId = activeChatRef.current?.waId;
      if (!participantId) return;

      const previous = manualState;
      // Optimistic update; rolled back if the request fails.
      setManualState((prev) =>
        prev && prev.participantId === participantId
          ? { ...prev, manual: next, timeManual: next ? new Date().toISOString() : null }
          : prev
      );
      setIsTogglingManual(true);

      try {
        const selectedWaId = localStorage.getItem("wa:selectedId") || "";
        const waId = sourceWaId || (selectedWaId === ALL_WA_IDS ? "" : selectedWaId);
        const headers: Record<string, string> = {};
        if (waId) headers["x-wa-id"] = waId;

        const { data } = await axios.patch(
          `${baseURL}/message-inbox/${encodeURIComponent(participantId)}/manual`,
          { manual: next ? 1 : 0 },
          { headers }
        );

        if (
          activeChatRef.current?.participantId !== participantId ||
          activeChatRef.current?.waId !== sourceWaId
        )
          return;
        setManualState(toManualState(participantId, data?.data, waId));
      } catch (error) {
        if (
          activeChatRef.current?.participantId === participantId &&
          activeChatRef.current?.waId === sourceWaId
        )
          setManualState(previous);
        console.error("Error updating manual state:", error);
      } finally {
        setIsTogglingManual(false);
      }
    },
    [baseURL, manualState, toManualState]
  );

  const reloadMessages = useCallback(
    (days: number = 365) => {
      const active = activeChatRef.current;
      const id = active?.participantId;
      if (!id) return;
      fetchMessages(id, days, active?.waId);
    },
    [fetchMessages]
  );

  const fetchInbox = useCallback(
    async (query?: string, page: number = 1, perPage: number = 100) => {
      const requestId = ++inboxRequestRef.current;
      try {
        const waIds = getSelectedWaIds();
        if (!waIds.length) return;

        setIsFetchInbox(true);
        const params: any = { page, perPage };
        if (query) params.searchTerm = query;

        const responses = await Promise.all(
          waIds.map(async (waId) => ({
            waId,
            response: await axios.get(`${baseURL}/message-inbox`, {
              params,
              headers: { "x-wa-id": waId },
            }),
          }))
        );

        const pageItems: Inbox[] = responses.flatMap(({ waId, response }) =>
          (response.data?.data || []).map((v: InboxResponse) => {
            const normalizedLastMessageStatus = String(v.last_message_status ?? "").toLowerCase();
            const created = new Date(v.created_at);
            const sameDay = new Date().toDateString() === created.toDateString();
            const timeStamp = sameDay
              ? created.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : created.toLocaleDateString("en-GB");

            return {
              // A participant may contact multiple WA lines, so both values form the UI identity.
              id: `${waId}:${v.id}`,
              waId,
              participantId: v.participant_id,
              name: v.participant_name ?? v.participant_id,
              image: "/assets/images/boy4.jpeg",
              lastMessage:
                v.message_text.length > 50 ? v.message_text.slice(0, 49) + "...." : v.message_text,
              timestamp: timeStamp,
              messageStatus: v.message_status === 1 ? "READ" : "DELIVERED",
              lastMessageStatus:
                normalizedLastMessageStatus === "read" ||
                normalizedLastMessageStatus === "delivered" ||
                normalizedLastMessageStatus === "sent" ||
                normalizedLastMessageStatus === "failed"
                  ? normalizedLastMessageStatus
                  : undefined,
              fromMe: v.from_me,
              notificationsCount: v.unread_msg,
              isPinned: !!v.is_pinned,
              pinnedAt: v.pinned_at || null,
              updatedAt: v.updated_at,
            };
          })
        );

        const newestUpdate =
          responses
            .map(({ response }) => response.data?.timeInfo?.updated_at || "")
            .sort()
            .pop() || "";
        if (requestId !== inboxRequestRef.current) return;
        setLastUpdate(newestUpdate);

        // Merge pages first
        setInbox((prev) => {
          const merged = page === 1 ? pageItems : [...prev, ...pageItems];
          // If toggle-search is on, filter *after* merging so we keep previous pages
          return toggleSearchRef.current
            ? merged.filter((item) => Number(item.notificationsCount) > 0)
            : merged;
        });

        setHasMore(
          responses.some(
            ({ response }) =>
              Array.isArray(response.data?.data) && response.data.data.length >= perPage
          )
        );
        setIsFetchInbox(false);

        // If active chat has new unread, refresh its messages
        pageItems.forEach((it) => {
          const unread =
            it.participantId === activeChatRef.current?.participantId &&
            (!activeChatRef.current?.waId || it.waId === activeChatRef.current.waId) &&
            Number(it.notificationsCount) > 0;
          if (unread) fetchMessages(it.participantId, 365, it.waId);
        });
      } catch (error) {
        if (requestId === inboxRequestRef.current) setIsFetchInbox(false);
        console.error("Error fetching inbox:", error);
      }
    },
    [baseURL, fetchMessages]
  );

  const handleChangeChat = useCallback(
    (chat: Inbox) => {
      setActiveChat(chat);
      setReplyTarget(null);
      setBookings(undefined);
      setBookingEvents(undefined);
      setManualState(undefined);
      localStorage.setItem(LS_ACTIVE_CHAT, chat.participantId); // ✅ persist
      localStorage.setItem(LS_ACTIVE_CHAT_WA_ID, chat.waId || "");
      fetchMessages(chat.participantId, 365, chat.waId);
      fetchManual(chat.participantId, chat.waId);
    },
    [fetchMessages, fetchManual]
  );

  const handleFirstOpenChat = useCallback((condition: boolean) => {
    setFirstOpenChat(condition);
  }, []);

  const handleSendMessage = useCallback(
    async (msg: MessagePayload) => {
      try {
        const payload = {
          to: msg.to,
          textMessage: msg.textMessage,
          mediaType: msg.mediaType,
          mediaId: msg.mediaId ?? null,
          filePath: msg.filePath ?? null,
          nonManual: msg.nonManual ?? false,
          contextMessageId: msg.contextMessageId ?? null,
        };
        const headers = activeChatRef.current?.waId
          ? { "x-wa-id": activeChatRef.current.waId }
          : undefined;
        await axios.post(`${baseURL}/message/send`, payload, { headers });
        setReplyTarget(null);
        if (msg.to) {
          fetchMessages(msg.to, 365, activeChatRef.current?.waId);
          // Sending flips the thread to manual server-side unless nonManual.
          fetchManual(msg.to, activeChatRef.current?.waId);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [baseURL, fetchMessages, fetchManual]
  );

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchText(query);
      setCurrentPage(1);
      setHasMore(true);

      await fetchInbox(query.trim() === "" ? undefined : query, 1);
    },
    [fetchInbox]
  );

  const handleToggleSearch = useCallback(
    (toggle: boolean) => {
      setToggleSearch(toggle);
      setCurrentPage(1);
      setHasMore(true);
      fetchInbox(searchText.trim() !== "" ? searchText : undefined, 1);
    },
    [fetchInbox, searchText]
  );

  const loadMore = useCallback(() => {
    setCurrentPage((prev) => {
      const next = prev + 1;
      fetchInbox(searchText.trim() !== "" ? searchText : undefined, next);
      return next;
    });
  }, [fetchInbox, searchText]);

  // Poll server for changes every 10s; only refetch when server says it changed
  useEffect(() => {
    const tick = async () => {
      try {
        const waIds = getSelectedWaIds();
        if (!waIds.length || !lastUpdateRef.current || isFetchInboxRef.current) return;
        // In the aggregate view, a single timestamp cannot represent every line reliably.
        // Refresh the current search directly; individual-line mode keeps the lightweight check.
        if (waIds.length > 1) {
          await fetchInbox(searchText.trim() !== "" ? searchText : undefined, 1);
          return;
        }
        const payload = { clientLastUpdate: lastUpdateRef.current };
        const response = await axios.post(`${baseURL}/event-check-inbox`, payload, {
          headers: { "x-wa-id": waIds[0] },
        });
        const changed = !!response.data?.data;
        if (changed) {
          await fetchInbox(searchText.trim() !== "" ? searchText : undefined, 1);
        }
      } catch (error) {
        console.error("Error checking inbox update:", error);
      }
    };

    if (getSelectedWaIds().length) tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [baseURL, fetchInbox, searchText]);

  // Initial fetch (if WA id already set before this mounts)
  useEffect(() => {
    if (getSelectedWaIds().length) {
      fetchInbox();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (didRestoreActiveRef.current) return;
    if (!inbox.length) return;

    const stored = localStorage.getItem(LS_ACTIVE_CHAT) || "";
    const storedWaId = localStorage.getItem(LS_ACTIVE_CHAT_WA_ID) || "";
    if (!stored) {
      didRestoreActiveRef.current = true;
      return;
    }

    const found = inbox.find(
      (x) => x.participantId === stored && (!storedWaId || x.waId === storedWaId)
    );
    if (found) {
      setActiveChat(found);
      fetchMessages(found.participantId, 365, found.waId);
      fetchManual(found.participantId, found.waId);
    }

    didRestoreActiveRef.current = true;
  }, [inbox, fetchMessages, fetchManual]);

  const handleFileUpload = useCallback(
    async (
      file: File,
      msg: string,
      type: string,
      nonManual: boolean,
      contextMessageId?: string | null
    ) => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Merge explicit content-type with default x-wa-id
        const uploadHeaders: Record<string, string> = {
          ...(axios.defaults.headers.common as any),
          "Content-Type": "multipart/form-data",
        };
        if (activeChatRef.current?.waId) {
          uploadHeaders["x-wa-id"] = activeChatRef.current.waId;
        }

        const uploadMedia = await axios.post(`${baseURL}/message/uploadMedia`, formData, {
          headers: uploadHeaders,
        });

        const payload = {
          to: activeChatRef.current?.participantId,
          textMessage: msg,
          mediaType: type,
          mediaId: uploadMedia.data.mediaId,
          filePath: uploadMedia.data.filePath,
          nonManual,
          contextMessageId: contextMessageId ?? null,
        };

        await axios.post(`${baseURL}/message/send`, payload, { headers: uploadHeaders });
        setReplyTarget(null);
        if (activeChatRef.current?.participantId) {
          fetchMessages(activeChatRef.current.participantId, 365, activeChatRef.current.waId);
          fetchManual(activeChatRef.current.participantId, activeChatRef.current.waId);
        }
      } catch (error) {
        console.error("Error upload image", error);
      }
    },
    [baseURL, fetchMessages, fetchManual]
  );

  return (
    <ChatContext.Provider
      value={{
        user,
        inbox,
        activeChat,
        participantMessages,
        firstOpenChat,
        searchText,
        searchResults,
        hasMore,
        replyTarget,
        isFetchInbox,
        bookingEvents,
        bookings,
        manualState,
        isTogglingManual,
        onToggleManual: handleToggleManual,
        onChangeChat: handleChangeChat,
        onSendMessage: handleSendMessage,
        onUploadFile: handleFileUpload,
        onReplyToMessage: setReplyTarget,
        onClearReplyTarget: () => setReplyTarget(null),
        onFirstOpenChat: handleFirstOpenChat,
        onSearch: handleSearch,
        onToggleSearch: handleToggleSearch,
        loadMore,
        reloadMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => React.useContext(ChatContext);
