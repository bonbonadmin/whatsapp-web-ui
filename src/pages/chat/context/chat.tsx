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

type SearchResult = Inbox | Message;  // Adjust based on your API response

type ChatContextProp = {
  user: User;
  inbox: Inbox[];
  participantMessages: Message[];
  firstOpenChat: boolean;
  activeChat?: Inbox;
  searchText: string;
  searchResults: SearchResult[];
  onChangeChat: (chat: Inbox) => void;
  onFirstOpenChat: (condition: boolean) => void;
  onSendMessage: (message: MessagePayload) => void;
  onUploadFile: (file: File, msg: string, type: string) => void;
  onSearch: (query: string) => void;
};

const initialValue: ChatContextProp = {
  user: { name: "Jazim Abbas", image: "/assets/images/girl.jpeg" },
  inbox,
  participantMessages: getMessages(),
  firstOpenChat: false,
  searchText: "",
  searchResults: [],
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const baseURL = process.env.REACT_APP_API_URL;

  const activeChatRef = useRef(activeChat);
  const lastUpdateRef = useRef(lastUpdate);

  // Update the ref whenever activeChat changes
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    lastUpdateRef.current = lastUpdate;
  }, [lastUpdate]);

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
    () => async (query?: string) => {
      try {
        const params = query ? { searchTerm: query } : {};
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
          setLastUpdate('');
        }
        // if (newInbox && newInbox.length > 0) {
        //   const sortUpdatedAt = [...newInbox].sort(
        //     (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        //   )[0];
        //   setLastUpdate(sortUpdatedAt.updatedAt);
        // }
  
        setInbox(newInbox);
      } catch (error) {
        console.error("Error fetching inbox:", error);
      }
    },
    [baseURL, fetchMessages]
  );

  const handleSearch = useMemo(
    () => async (query: string) => {
      console.log("handling search: ", query);
      setSearchText(query);
      // console.log("searchText1:", searchText);

      if (query.trim() === "") {
        // If the search query is empty, fetch the standard inbox
        fetchInbox();
        return;
      }
      //setIsSearching(true);
      try {
        // Fetch inbox with the search term
        await fetchInbox(query);
      } catch (error) {
        console.error("Error performing search:", error);
      }
    },
    [fetchInbox, inbox]
  );

  useEffect(() => {
    // Define the async function inside useEffect to call the API
    const fetchData = async () => {
      // console.log("Searchtext: ", searchText);
      try {
        // API endpoint
        if (lastUpdateRef.current && lastUpdateRef.current !== "") {
          const payload = {
            clientLastUpdate: lastUpdateRef.current,
          };
          const response = await axios.post(`${baseURL}/event-check-inbox`, payload);
          console.log(response.data);
          if (response.data && response.data.data) {
            fetchInbox(searchText.trim() !== "" ? searchText : undefined);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 5000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  useEffect(() => {
    if (inbox.length === 0) {
      fetchInbox();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inbox]);

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
        onChangeChat: handleChangeChat,
        onSendMessage: handleSendMessage,
        onUploadFile: handleFileUpload,
        onFirstOpenChat: handleFirstOpenChat,
        onSearch: handleSearch,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => React.useContext(ChatContext);
