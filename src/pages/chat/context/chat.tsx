// /pages/chat/context/chat.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { isAuthenticated } from "common/auth/session";
import { mapMessage, mapTool } from "./map-message";
import { mergeInbox, mergeMessages } from "./merge";

import { inbox as demoInbox } from "../data/inbox";
import { Booking, Inbox, InboxResponse } from "common/types/common.type";
import {
  getMessages,
  Message,
  MessagePayload,
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
  inboxError: string;
  isLoadingMessages: boolean;
  messageError: string;
  hasOlderMessages: boolean;
  viewingHistory: boolean;
  returnToLatest: () => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  revealMessage: (id: string) => Promise<void>;
  initializeInbox: () => void;
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
  inboxError: "",
  isLoadingMessages: false,
  messageError: "",
  hasOlderMessages: false,
  viewingHistory: false,
  async returnToLatest() {},
  async loadOlderMessages() {},
  async revealMessage() {},
  initializeInbox() {},
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

export const ChatContext = React.createContext<ChatContextProp>(initialValue);

export default function ChatProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User>(initialValue.user);
  const [inbox, setInbox] = useState<Inbox[]>([]);
  const [activeChat, setActiveChat] = useState<Inbox>();
  const [participantMessages, setMessages] = useState<Message[]>([]);
  const [firstOpenChat, setFirstOpenChat] = useState(false);

  const [searchText, setSearchText] = useState<string>("");
  const [toggleSearch, setToggleSearch] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const currentPageRef = useRef(1);
  const [inboxError, setInboxError] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const messagesRef = useRef<Message[]>([]);
  const [viewingHistory, setViewingHistory] = useState(false);
  const historyViewRef = useRef(false);
  const oldestMessageRef = useRef<number | null>(null);
  const messageLoadingRef = useRef(false);
  const messageAbortRef = useRef<AbortController>();
  const contextAbortRef = useRef<AbortController>();
  const inboxAbortRef = useRef<AbortController>();
  const queryRef = useRef("");
  const inboxKeyRef = useRef("");
  const versionsRef = useRef<Record<string, string>>({});
  const messageVersionsRef = useRef<Record<string, string>>({});

  const messageCacheRef = useRef(
    new Map<string, { messages: Message[]; oldest: number | null; hasMore: boolean }>()
  );
  const [searchResults] = useState<SearchResult[]>([]);
  const [isFetchInbox, setIsFetchInbox] = useState<boolean>(false);
  const [bookingEvents, setBookingEvents] = useState<BookingEvent[] | undefined>(undefined);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [bookings, setBookings] = useState<Booking[] | undefined>(undefined);
  const [manualState, setManualState] = useState<ManualState | undefined>(undefined);
  const [isTogglingManual, setIsTogglingManual] = useState<boolean>(false);

  const baseURL = process.env.REACT_APP_API_URL;

  const activeChatRef = useRef(activeChat);
  const toggleSearchRef = useRef(toggleSearch);
  const isFetchInboxRef = useRef(isFetchInbox);
  const didRestoreActiveRef = useRef(false);
  const messageRequestRef = useRef(0);
  const inboxRequestRef = useRef(0);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);
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
    async (
      id: string,
      days: number = 365,
      sourceWaId?: string,
      mode: "latest" | "older" | "refresh" | "around" = "latest",
      aroundId?: string
    ) => {
      if (
        !id ||
        ((mode === "older" || mode === "refresh") && messageLoadingRef.current) ||
        (mode === "refresh" && historyViewRef.current)
      )
        return;
      if (mode === "latest" || mode === "around") {
        historyViewRef.current = mode === "around";
        setViewingHistory(historyViewRef.current);
      }
      messageAbortRef.current?.abort();
      const controller = new AbortController();
      messageAbortRef.current = controller;
      const requestId = ++messageRequestRef.current;
      messageLoadingRef.current = true;
      setIsLoadingMessages(true);
      setMessageError("");
      try {
        const selectedWaId = localStorage.getItem("wa:selectedId") || "";
        const waId = sourceWaId || (selectedWaId === ALL_WA_IDS ? "" : selectedWaId);
        const headers: Record<string, string> = {};
        if (waId) headers["x-wa-id"] = waId;

        const refreshingLoadedHistory = mode === "refresh" && !!oldestMessageRef.current;
        const params: Record<string, any> = {
          limit: 50,
          days: -1,
          includeContext: 0,
          includeErrors: 0,
        };
        if (mode === "older") params.beforeId = oldestMessageRef.current;
        if (mode === "around") params.aroundId = aroundId;
        // Refresh only the history already loaded, including status changes. Never refetch a year.
        if (mode === "refresh" && oldestMessageRef.current)
          params.sinceId = oldestMessageRef.current;
        const { data } = await axios.get(`${baseURL}/message-inbox/${encodeURIComponent(id)}`, {
          params,
          headers,
          signal: controller.signal,
          timeout: 20000,
        });
        if (data.success === false) throw new Error(data.message || "Could not load messages.");
        if (requestId !== messageRequestRef.current) return;

        const merged = mergeMessages(
          [],
          [...(data.data || []).map(mapMessage), ...(data.tools || []).map(mapTool)]
        );

        if (requestId !== messageRequestRef.current) return;
        let nextMessages =
          mode === "latest" || mode === "around"
            ? merged
            : mergeMessages(messagesRef.current, merged);
        // Catch up every page when more than 50 rows changed/arrived while away.
        let pageData = data;
        while (refreshingLoadedHistory && pageData.hasMore && pageData.newestId) {
          const response = await axios.get(`${baseURL}/message-inbox/${encodeURIComponent(id)}`, {
            params: {
              limit: 100,
              days: -1,
              afterId: pageData.newestId,
              includeContext: 0,
              includeErrors: 0,
            },
            headers,
            signal: controller.signal,
            timeout: 20000,
          });
          if (response.data.success === false) throw new Error(response.data.message);
          pageData = response.data;
          const moreMessages = (pageData.data || []).map(mapMessage);
          const moreTools = (pageData.tools || []).map(mapTool);
          nextMessages = mergeMessages(nextMessages, [...moreMessages, ...moreTools]);
        }
        if (requestId !== messageRequestRef.current) return;
        messagesRef.current = nextMessages;
        setMessages(nextMessages);
        const hasMore = refreshingLoadedHistory
          ? messageCacheRef.current.get(`${waId}:${id}`)?.hasMore ?? false
          : !!data.hasMore;
        if (!refreshingLoadedHistory) {
          oldestMessageRef.current = data.oldestId;
          setHasOlderMessages(hasMore);
        }
        if (messageCacheRef.current.size >= 10)
          messageCacheRef.current.delete(messageCacheRef.current.keys().next().value!);
        if (!historyViewRef.current)
          messageCacheRef.current.set(`${waId}:${id}`, {
            messages: nextMessages,
            oldest: oldestMessageRef.current,
            hasMore,
          });
        // Legacy failure details are optional and must not delay the message list.
        const failed = nextMessages
          .filter(
            (m) => m.messageStatus === "failed" && m.errors == null && m.messageType !== "tool"
          )
          .slice(-100);
        if (failed.length) {
          void axios
            .get(`${baseURL}/message-inbox/${encodeURIComponent(id)}/errors`, {
              params: { ids: failed.map((m) => m.id).join(",") },
              headers,
              signal: controller.signal,
              timeout: 15000,
            })
            .then(({ data: details }) => {
              if (requestId !== messageRequestRef.current) return;
              const enriched = messagesRef.current.map((m) =>
                m.messageId && details.errors?.[m.messageId]
                  ? { ...m, errors: details.errors[m.messageId] }
                  : m
              );
              messagesRef.current = enriched;
              setMessages(enriched);
            })
            .catch(() => {
              /* Receipt details can be retried on the next refresh. */
            });
        }
        return true;
      } catch (error) {
        if (!axios.isCancel(error) && requestId === messageRequestRef.current)
          setMessageError("Could not load messages. Please retry.");
      } finally {
        if (requestId === messageRequestRef.current) {
          messageLoadingRef.current = false;
          setIsLoadingMessages(false);
        }
      }
    },
    [baseURL]
  );

  const fetchContext = useCallback(
    async (id: string, waId?: string) => {
      contextAbortRef.current?.abort();
      const controller = new AbortController();
      contextAbortRef.current = controller;
      try {
        const { data } = await axios.get(
          `${baseURL}/message-inbox/${encodeURIComponent(id)}/context`,
          {
            headers: { "x-wa-id": waId || "" },
            signal: controller.signal,
            timeout: 7000,
          }
        );
        if (
          controller.signal.aborted ||
          activeChatRef.current?.participantId !== id ||
          activeChatRef.current?.waId !== waId
        )
          return;
        const next: Booking[] = data.bookings || [];
        setBookings(next);
        setBookingEvents(next.map(({ event_name, started_at }) => ({ event_name, started_at })));
      } catch {
        /* The timeline stays usable if booking prefill is unavailable. */
      }
    },
    [baseURL]
  );

  const loadOlderMessages = useCallback(async () => {
    const active = activeChatRef.current;
    if (active && oldestMessageRef.current && !messageLoadingRef.current)
      await fetchMessages(active.participantId, -1, active.waId, "older");
  }, [fetchMessages]);

  const returnToLatest = useCallback(async () => {
    const active = activeChatRef.current;
    if (active) await fetchMessages(active.participantId, -1, active.waId, "latest");
  }, [fetchMessages]);

  const revealMessage = useCallback(
    async (id: string) => {
      if (messagesRef.current.some((message) => message.id === id)) return;
      const active = activeChatRef.current;
      if (active) await fetchMessages(active.participantId, -1, active.waId, "around", id);
    },
    [fetchMessages]
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
      if (days === -1) {
        void loadOlderMessages();
        return;
      }
      fetchMessages(id, days, active?.waId, "refresh");
    },
    [fetchMessages, loadOlderMessages]
  );

  const fetchInbox = useCallback(
    async (query: string = queryRef.current, page: number = 1, background = false) => {
      if (!isAuthenticated()) return;
      const waIds = getSelectedWaIds();
      if (!waIds.length || (page > 1 && isFetchInboxRef.current)) return;
      const key = JSON.stringify([waIds, query.trim(), toggleSearchRef.current]);
      const changedQuery = key !== inboxKeyRef.current;
      if (background && isFetchInboxRef.current) return;
      inboxAbortRef.current?.abort();
      const controller = new AbortController();
      inboxAbortRef.current = controller;
      const requestId = ++inboxRequestRef.current;
      inboxKeyRef.current = key;
      isFetchInboxRef.current = true;
      setIsFetchInbox(true);
      setInboxError("");
      if (changedQuery) {
        setInbox([]);
        currentPageRef.current = 1;
        setHasMore(false);
      }
      const perPage = 50;
      try {
        const response = await axios.get(`${baseURL}/message-inbox`, {
          params: {
            page,
            perPage,
            waIds: waIds.length > 1 ? waIds.join(",") : undefined,
            searchTerm: query || undefined,
            unreadOnly: toggleSearchRef.current ? 1 : undefined,
          },
          headers: { "x-wa-id": waIds[0] },
          signal: controller.signal,
          timeout: 20000,
        });
        if (response.data.success === false) throw new Error(response.data.message);
        if (requestId !== inboxRequestRef.current || controller.signal.aborted) return;
        const pageItems: Inbox[] = (response.data.data || []).map((v: InboxResponse) => {
          const normalizedLastMessageStatus = String(v.last_message_status ?? "").toLowerCase();
          const waId = v.display_phone_id || (waIds.length === 1 ? waIds[0] : "");
          if (!waId || !waIds.includes(waId)) throw new Error("Invalid inbox line.");

          return {
            // A participant may contact multiple WA lines, so both values form the UI identity.
            id: `${waId}:${v.participant_id}`,
            waId,
            participantId: v.participant_id,
            name: v.participant_name ?? v.participant_id,
            image: "/assets/images/boy4.jpeg",
            lastMessage: v.message_text || "",
            timestamp: new Date(v.created_at).toISOString(),
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
            isPinned: v.is_pinned === true || Number(v.is_pinned) === 1,
            pinnedAt: v.pinned_at || null,
            updatedAt: v.updated_at,
            searchRank: Number(v.search_rank || 0),
          };
        });
        Object.assign(
          versionsRef.current,
          response.data.versions ||
            (waIds.length === 1 ? { [waIds[0]]: response.data.version || "" } : {})
        );
        setInbox((prev) => {
          const replace = page === 1 && (!background || currentPageRef.current === 1);
          return replace ? pageItems : mergeInbox(prev, pageItems);
        });
        if (!background) currentPageRef.current = page;
        // A page-one background refresh must not reopen exhausted deeper pagination.
        if (!background || currentPageRef.current === 1)
          setHasMore(response.data.hasMore ?? pageItems.length >= perPage);
      } catch (error) {
        if (!axios.isCancel(error) && requestId === inboxRequestRef.current)
          setInboxError("Chats could not be loaded. Press Enter to retry.");
      } finally {
        if (requestId === inboxRequestRef.current) {
          isFetchInboxRef.current = false;
          setIsFetchInbox(false);
        }
      }
    },
    [baseURL]
  );

  const handleChangeChat = useCallback(
    (chat: Inbox) => {
      didRestoreActiveRef.current = true;
      messageLoadingRef.current = false;
      historyViewRef.current = false;
      setViewingHistory(false);
      activeChatRef.current = chat;
      setActiveChat(chat);
      const cached = messageCacheRef.current.get(`${chat.waId}:${chat.participantId}`);
      messagesRef.current = cached?.messages || [];
      setMessages(messagesRef.current);
      oldestMessageRef.current = cached?.oldest ?? null;
      setHasOlderMessages(cached?.hasMore ?? false);
      setReplyTarget(null);
      setBookings(undefined);
      setBookingEvents(undefined);
      setManualState(undefined);
      localStorage.setItem(LS_ACTIVE_CHAT, chat.participantId); // ✅ persist
      localStorage.setItem(LS_ACTIVE_CHAT_WA_ID, chat.waId || "");
      fetchMessages(chat.participantId, 365, chat.waId, cached ? "refresh" : "latest");
      fetchContext(chat.participantId, chat.waId);
      fetchManual(chat.participantId, chat.waId);
    },
    [fetchMessages, fetchManual, fetchContext]
  );

  const handleFirstOpenChat = useCallback((condition: boolean) => {
    setFirstOpenChat(condition);
  }, []);

  const handleSendMessage = useCallback(
    async (msg: MessagePayload) => {
      const sendingChat = activeChatRef.current;
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
        const headers = sendingChat?.waId ? { "x-wa-id": sendingChat.waId } : undefined;
        await axios.post(`${baseURL}/message/send`, payload, { headers });
        setReplyTarget(null);
        if (msg.to && activeChatRef.current === sendingChat) {
          fetchMessages(msg.to, 365, sendingChat?.waId, "refresh");
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
    (query: string) => {
      queryRef.current = query.trim();
      setSearchText(query);
      currentPageRef.current = 1;
      void fetchInbox(queryRef.current, 1);
    },
    [fetchInbox]
  );

  const handleToggleSearch = useCallback(
    (toggle: boolean) => {
      toggleSearchRef.current = toggle;
      setToggleSearch(toggle);
      currentPageRef.current = 1;
      void fetchInbox(queryRef.current, 1);
    },
    [fetchInbox]
  );

  const initializeInbox = useCallback(() => {
    const key = JSON.stringify([getSelectedWaIds(), queryRef.current, toggleSearchRef.current]);
    if (key !== inboxKeyRef.current) void fetchInbox(queryRef.current, 1);
  }, [fetchInbox]);

  const loadMore = useCallback(() => {
    if (!isFetchInboxRef.current) void fetchInbox(queryRef.current, currentPageRef.current + 1);
  }, [fetchInbox]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const tick = async () => {
      try {
        const waIds = getSelectedWaIds();
        if (!document.hidden && isAuthenticated() && waIds.length && !isFetchInboxRef.current) {
          const active = activeChatRef.current;
          const checkIds = Array.from(new Set([...waIds, ...(active?.waId ? [active.waId] : [])]));
          const { data } = await axios.post(
            `${baseURL}/event-check-inbox`,
            {
              waIds: checkIds,
              versions: versionsRef.current,
            },
            { signal: controller.signal, timeout: 10000 }
          );
          if (cancelled) return;
          const changed: string[] = data.changed || [];
          if (changed.some((id) => waIds.includes(id))) await fetchInbox(queryRef.current, 1, true);
          const messageKey = active ? `${active.waId}:${active.participantId}` : "";
          const messageVersion = active?.waId ? data.versions?.[active.waId] : undefined;
          if (
            active &&
            active === activeChatRef.current &&
            messageVersion !== undefined &&
            messageVersionsRef.current[messageKey] !== messageVersion
          ) {
            const refreshed = await fetchMessages(
              active.participantId,
              365,
              active.waId,
              "refresh"
            );
            // A skipped/failed refresh must retry even if the inbox already consumed this version.
            if (refreshed) messageVersionsRef.current[messageKey] = messageVersion;
          }
        }
      } catch {
        /* Retry at the next interval, without replacing usable cached data. */
      } finally {
        if (!cancelled) timer = setTimeout(tick, 10000);
      }
    };
    timer = setTimeout(tick, 10000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [baseURL, fetchInbox, fetchMessages]);

  useEffect(
    () => () => {
      inboxAbortRef.current?.abort();
      messageAbortRef.current?.abort();
      contextAbortRef.current?.abort();
    },
    []
  );

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
      handleChangeChat(found);
    }

    if (found || !isFetchInbox) didRestoreActiveRef.current = true;
  }, [inbox, isFetchInbox, handleChangeChat]);

  const handleFileUpload = useCallback(
    async (
      file: File,
      msg: string,
      type: string,
      nonManual: boolean,
      contextMessageId?: string | null
    ) => {
      const sendingChat = activeChatRef.current;
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Merge explicit content-type with default x-wa-id
        const uploadHeaders: Record<string, string> = {
          ...(axios.defaults.headers.common as any),
          "Content-Type": "multipart/form-data",
        };
        if (sendingChat?.waId) {
          uploadHeaders["x-wa-id"] = sendingChat.waId;
        }

        const uploadMedia = await axios.post(`${baseURL}/message/uploadMedia`, formData, {
          headers: uploadHeaders,
        });

        const payload = {
          to: sendingChat?.participantId,
          textMessage: msg,
          mediaType: type,
          mediaId: uploadMedia.data.mediaId,
          filePath: uploadMedia.data.filePath,
          nonManual,
          contextMessageId: contextMessageId ?? null,
        };

        await axios.post(`${baseURL}/message/send`, payload, { headers: uploadHeaders });
        setReplyTarget(null);
        if (sendingChat?.participantId && activeChatRef.current === sendingChat) {
          fetchMessages(sendingChat.participantId, 365, sendingChat.waId, "refresh");
          fetchManual(sendingChat.participantId, sendingChat.waId);
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
        inboxError,
        isLoadingMessages,
        messageError,
        hasOlderMessages,
        loadOlderMessages,
        revealMessage,
        initializeInbox,
        viewingHistory,
        returnToLatest,
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
