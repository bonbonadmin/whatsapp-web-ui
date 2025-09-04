// /pages/chat/context/chat.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import { inbox as demoInbox } from "../data/inbox";
import { Inbox, InboxResponse } from "common/types/common.type";
import {
  getMessages,
  Message,
  MessagePayload,
  MessageResponse,
} from "../chat-room-page/components/messages-list/data/get-messages";

type BookingEvent = { event_name: string; started_at: string };

type User = {
  name: string;
  image: string;
};

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
  onChangeChat: (chat: Inbox) => void;
  onFirstOpenChat: (condition: boolean) => void;
  onSendMessage: (message: MessagePayload) => void;
  onUploadFile: (file: File, msg: string, type: string, nonManual: boolean) => void;
  onSearch: (query: string) => void;
  onToggleSearch: (toggle: boolean) => void;
  loadMore: () => void;
  isFetchInbox: boolean;
  bookingEvents?: BookingEvent[];
};

const initialValue: ChatContextProp = {
  user: { name: "Jazim Abbas", image: "/assets/images/girl.jpeg" },
  inbox: demoInbox,
  participantMessages: getMessages(),
  firstOpenChat: false,
  searchText: "",
  searchResults: [],
  hasMore: true,
  isFetchInbox: false,
  bookingEvents: undefined,
  onChangeChat() {
    throw new Error();
  },
  onSendMessage() {
    throw new Error();
  },
  onUploadFile() {
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
};

export const ChatContext = React.createContext<ChatContextProp>(initialValue);

export default function ChatProvider(props: { children: any }) {
  const { children } = props;

  const [user] = useState<User>(initialValue.user);
  const [inbox, setInbox] = useState<Inbox[]>([]);
  const [activeChat, setActiveChat] = useState<Inbox>();
  const [participantMessages, setMessages] = useState<Message[]>(initialValue.participantMessages);
  const [firstOpenChat, setFirstOpenChat] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [searchText, setSearchText] = useState<string>("");
  const [toggleSearch, setToggleSearch] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isFetchInbox, setIsFetchInbox] = useState<boolean>(false);
  const [bookingEvents, setBookingEvents] = useState<BookingEvent[] | undefined>(undefined);

  const baseURL = process.env.REACT_APP_API_URL;

  const activeChatRef = useRef(activeChat);
  const lastUpdateRef = useRef(lastUpdate);
  const toggleSearchRef = useRef(toggleSearch);
  const isFetchInboxRef = useRef(isFetchInbox);

  // keep refs in sync
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { lastUpdateRef.current = lastUpdate; }, [lastUpdate]);
  useEffect(() => { toggleSearchRef.current = toggleSearch; }, [toggleSearch]);
  useEffect(() => { isFetchInboxRef.current = isFetchInbox; }, [isFetchInbox]);

  // Ensure axios header has x-wa-id on mount (so first GET uses it if already selected)
  useEffect(() => {
    const storedId = localStorage.getItem("wa:selectedId") || "";
    if (storedId) {
      axios.defaults.headers.common["x-wa-id"] = storedId;
    } else {
      delete axios.defaults.headers.common["x-wa-id"];
    }
  }, []);

  const handleChangeChat = (chat: Inbox) => {
    setActiveChat(chat);
    fetchMessages(chat.participantId);
  };

  const handleFirstOpenChat = (condition: boolean) => {
    setFirstOpenChat(condition);
  };

  const handleSendMessage = async (msg: MessagePayload) => {
    try {
      const payload = {
        to: msg.to,
        textMessage: msg.textMessage,
        mediaType: msg.mediaType,
        mediaId: msg.mediaId ?? null,
        filePath: msg.filePath ?? null,
        nonManual: msg.nonManual ?? false,
      };
      await axios.post(`${baseURL}/message/send`, payload);
      fetchMessages(msg.to);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const fetchMessages = useMemo(
    () => async (id: any) => {
      try {
        const response = await axios.get(`${baseURL}/message-inbox/` + id);
        const newMessages: Message[] = [];

        // booking events (if present)
        const raw = Array.isArray(response.data?.bookingEvents)
          ? response.data.bookingEvents
          : [];
        const normalizedEvents: BookingEvent[] = raw
          .map((e: any) => ({
            event_name: e.event_name ?? e.booking_event_name,
            started_at: e.started_at,
          }))
          .filter((e: BookingEvent) => e.event_name && e.started_at);

        setBookingEvents(normalizedEvents.length ? normalizedEvents : undefined);

        if (response.data.data.length) {
          response.data.data.forEach((value: MessageResponse) => {
            const timeStamp =
              new Date().toDateString() === new Date(value.created_at).toDateString()
                ? new Date(value.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : new Date(value.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                  });
            const data: Message = {
              id: value.id,
              body: value.message_text,
              date: new Date(value.created_at).toLocaleDateString(),
              timestamp: timeStamp,
              messageStatus: value.participant_message_status,
              isOpponent: value.from_me === 0 ? true : false,
              messageType: value.message_type,
              mediaLocation: value.media_location,
            };
            newMessages.push(data);
          });
        }
        setMessages(newMessages);
      } catch (error) {
        console.error("Error fetching messages list:", error);
      }
    },
    [baseURL]
  );

  const fetchInbox = useMemo(
    () =>
      async (query?: string, page: number = 1, perPage: number = 100) => {
        try {
          // ensure we have a WA id before fetching
          if (!axios.defaults.headers.common["x-wa-id"]) {
            return;
          }

          setIsFetchInbox(true);
          const params: any = { page, perPage };
          if (query) params.searchTerm = query;

          const response = await axios.get(`${baseURL}/message-inbox`, { params });

          const newInbox: Inbox[] = [];
          response.data.data.forEach((value: InboxResponse) => {
            const timeStamp =
              new Date().toDateString() === new Date(value.created_at).toDateString()
                ? new Date(value.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : new Date(value.created_at).toLocaleDateString("en-GB");

            const data: Inbox = {
              id: value.id,
              participantId: value.participant_id,
              name: value.participant_name ?? value.participant_id,
              image: "/assets/images/boy4.jpeg",
              lastMessage:
                value.message_text.length > 50
                  ? value.message_text.slice(0, 49) + "...."
                  : value.message_text,
              timestamp: timeStamp,
              messageStatus: value.message_status === 1 ? "READ" : "DELIVERED",
              notificationsCount: value.unread_msg,
              isPinned: !!value.is_pinned,
              pinnedAt: value.pinned_at || null,
              updatedAt: value.updated_at,
            };
            newInbox.push(data);

            // refresh open chat if unread
            if (
              data.participantId === activeChatRef.current?.participantId &&
              value.message_status === 0
            ) {
              fetchMessages(data.participantId);
            }
          });

          const timeInfo = response.data.timeInfo;
          if (timeInfo?.updated_at) {
            setLastUpdate(timeInfo.updated_at);
          } else {
            setLastUpdate("");
          }

          setInbox((prev) => (page === 1 ? newInbox : [...prev, ...newInbox]));

          if (toggleSearchRef.current) {
            const onlyUnread = newInbox.filter(
              (item) => Number(item.notificationsCount) > 0
            );
            setInbox(onlyUnread);
          }

          setHasMore(newInbox.length >= perPage);
          setIsFetchInbox(false);
        } catch (error) {
          setIsFetchInbox(false);
          console.error("Error fetching inbox:", error);
        }
      },
    [baseURL, fetchMessages]
  );

  const handleSearch = useMemo(
    () => async (query: string) => {
      setInbox([]);
      setSearchText(query);
      setCurrentPage(1);
      setHasMore(true);

      if (query.trim() === "") {
        await fetchInbox(undefined, 1);
        return;
      }
      try {
        await fetchInbox(query, 1);
      } catch (error) {
        console.error("Error performing search:", error);
      }
    },
    [fetchInbox]
  );

  const handleToggleSearch = (toggle: boolean) => {
    setToggleSearch(toggle);
    if (toggle) {
      const filteredInbox: Inbox[] =
        inbox.filter((item) => Number(item.notificationsCount) > 0) ?? [];
      setInbox(filteredInbox);
    } else {
      setInbox([]);
      fetchInbox(searchText.trim() !== "" ? searchText : undefined);
    }
  };

  const loadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchInbox(searchText.trim() !== "" ? searchText : undefined, nextPage);
  }, [currentPage, fetchInbox, searchText]);

  // Poll server for changes every 10s; only refetch when server says it changed
  useEffect(() => {
    const tick = async () => {
      try {
        // must have a waId header set, a lastUpdate value, and not be mid-fetch
        if (
          !axios.defaults.headers.common["x-wa-id"] ||
          !lastUpdateRef.current ||
          isFetchInboxRef.current
        ) {
          return;
        }

        const payload = { clientLastUpdate: lastUpdateRef.current };
        const response = await axios.post(`${baseURL}/event-check-inbox`, payload);
        const changed = !!response.data?.data;

        if (changed) {
          // only refetch if server indicates a change
          setInbox([]);
          await fetchInbox(searchText.trim() !== "" ? searchText : undefined, 1);
        }
      } catch (error) {
        console.error("Error checking inbox update:", error);
      }
    };

    // initial tick (only if we already have a waId)
    if (axios.defaults.headers.common["x-wa-id"]) {
      tick();
    }

    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [baseURL, fetchInbox, searchText]);

  // initial load: only if we already have a waId header (Sidebar may set it later & call onSearch)
  useEffect(() => {
    if (axios.defaults.headers.common["x-wa-id"]) {
      fetchInbox();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (
    file: File,
    msg: string,
    type: string,
    nonManual: boolean
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers = { "Content-Type": "multipart/form-data" };
      const uploadMedia = await axios.post(`${baseURL}/message/uploadMedia`, formData, {
        headers,
      });

      const payload = {
        to: activeChat?.participantId,
        textMessage: msg,
        mediaType: type,
        mediaId: uploadMedia.data.mediaId,
        filePath: uploadMedia.data.filePath,
        nonManual,
      };

      await axios.post(`${baseURL}/message/send`, payload);
      fetchMessages(activeChat?.participantId);
    } catch (error) {
      console.error("Error upload image", error);
    }
  };

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
        isFetchInbox,
        bookingEvents,
        onChangeChat: handleChangeChat,
        onSendMessage: handleSendMessage,
        onUploadFile: handleFileUpload,
        onFirstOpenChat: handleFirstOpenChat,
        onSearch: handleSearch,
        onToggleSearch: handleToggleSearch,
        loadMore,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => React.useContext(ChatContext);