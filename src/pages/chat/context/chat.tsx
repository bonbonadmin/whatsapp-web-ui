import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { inbox } from "../data/inbox";
import { Inbox, InboxResponse } from "common/types/common.type";
import {
  getMessages,
  Message,
  MessagePayload,
  MessageResponse,
} from "../chat-room-page/components/messages-list/data/get-messages";
import axios from "axios";

type User = {
  name: string;
  image: string;
};

type SearchResult = Inbox | Message; // Adjust based on your API response

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
  onUploadFile: (file: File, msg: string, type: string) => void;
  onSearch: (query: string) => void;
  onToggleSearch: (toggle: boolean) => void;
  loadMore: () => void;
  isFetchInbox: boolean;
};

const initialValue: ChatContextProp = {
  user: { name: "Jazim Abbas", image: "/assets/images/girl.jpeg" },
  inbox,
  participantMessages: getMessages(),
  firstOpenChat: false,
  searchText: "",
  searchResults: [],
  hasMore: true,
  isFetchInbox: false,
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
  const baseURL = process.env.REACT_APP_API_URL;

  const activeChatRef = useRef(activeChat);
  const lastUpdateRef = useRef(lastUpdate);
  const toggleSearchRef = useRef(toggleSearch);
  const isFetchInboxRef = useRef(isFetchInbox);

  // Update the ref whenever activeChat changes
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
      };

      await axios.post(`${baseURL}/message/send`, payload);
      fetchMessages(msg.to);
    } catch (error) {
      console.error("Error fetching messages list:", error);
    }
  };

  const fetchMessages = useMemo(
    () => async (id: any) => {
      try {
        axios
          .get(`${baseURL}/message-inbox/` + id)
          .then((response) => {
            const newMessages: Message[] = [];
            if (response.data.data.length) {
              response.data.data.forEach((value: MessageResponse) => {
                // const timeStamp =
                //   new Date(value.created_at).getHours() +
                //   ":" +
                //   new Date(value.created_at).getMinutes();
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
                  messageStatus: value.message_status === 1 ? "READ" : "DELIVERED",
                  isOpponent: value.from_me === 0 ? true : false,
                  messageType: value.message_type,
                  mediaLocation: value.media_location
                };
                newMessages.push(data);
              });
            }
            setMessages(newMessages);
          })
          .catch((err) => {
            console.log(err.message);
          });
      } catch (error) {
        console.error("Error fetching messages list:", error);
      }
    },
    []
  );
  // Function to fetch inbox data
  const fetchInbox = useMemo(
    () =>
      async (query?: string, page: number = 1, perPage: number = 100) => {
        try {
          setIsFetchInbox(true);
          const params: any = { page, perPage };
          if (query) params.searchTerm = query;
          console.log("params: ", params);
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
              updatedAt: value.updated_at,
            };
            newInbox.push(data);

            // Fetch messages for active chat if conditions are met
            if (
              data.participantId === activeChatRef.current?.participantId &&
              value.message_status === 0
            ) {
              fetchMessages(data.participantId);
            }
          });

          const timeInfo = response.data.timeInfo;
          if (timeInfo) {
            setLastUpdate(timeInfo.updated_at);
          } else {
            setLastUpdate("");
          }
          // if (newInbox && newInbox.length > 0) {
          //   const sortUpdatedAt = [...newInbox].sort(
          //     (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          //   )[0];
          //   setLastUpdate(sortUpdatedAt.updatedAt);
          // }

          //setInbox(newInbox);
          setInbox((prevInbox) => [...prevInbox, ...newInbox]);
          if (toggleSearchRef.current) {
            let i = 0;
            while (i < newInbox.length) {
              if (Number(newInbox[i].notificationsCount) <= 0) {
                newInbox.splice(i, 1); // Remove the element at index i
              } else {
                i++; // Move to the next index only if no removal happens
              }
            }
            setInbox(newInbox);
          }
          if (newInbox.length < perPage) {
            setHasMore(false); // No more data to fetch
          } else {
            setHasMore(true);
          }
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
      console.log("handling search: ", query);
      setInbox([]);
      setSearchText(query);
      setCurrentPage(1); // Reset to first page
      setHasMore(true); // Reset hasMore
      // console.log("searchText1:", searchText);

      if (query.trim() === "") {
        // If the search query is empty, fetch the standard inbox
        console.log("one");
        await fetchInbox(undefined, 1);
        return;
      }
      //setIsSearching(true);
      try {
        // Fetch inbox with the search term
        console.log("two");
        await fetchInbox(query, 1);
      } catch (error) {
        console.error("Error performing search:", error);
      }
    },
    [fetchInbox, inbox]
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
    console.log("Loading more: ", nextPage);
    fetchInbox(searchText.trim() !== "" ? searchText : undefined, nextPage);
  }, [hasMore, currentPage, fetchInbox, searchText]);

  useEffect(() => {
    // Define the async function inside useEffect to call the API
    const fetchData = async () => {
      // console.log("Searchtext: ", searchText);
      try {
        // API endpoint
        if (!isFetchInboxRef.current) {
          if (lastUpdateRef.current && lastUpdateRef.current !== "") {
            const payload = {
              clientLastUpdate: lastUpdateRef.current,
            };
            const response = await axios.post(`${baseURL}/event-check-inbox`, payload);
            console.log(response.data);
            if (response.data && response.data.data) {
              setInbox([]);
              fetchInbox(searchText.trim() !== "" ? searchText : undefined);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 10000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // useEffect(() => {
  //   if (inbox.length === 0) {
  //     console.log("Empty Inbox");
  //     fetchInbox();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [inbox]);

  useEffect(() => {
    fetchInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (file: File, msg: string, type: string) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers = {
        "Content-Type": "multipart/form-data",
      };

      const uploadMedia = await axios.post(`${baseURL}/message/uploadMedia`, formData, {
        headers,
      });

      const payload = {
        to: activeChat?.participantId,
        textMessage: msg,
        mediaType: type,
        mediaId: uploadMedia.data.mediaId,
        filePath: uploadMedia.data.filePath,
      };
      console.log(payload);

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
