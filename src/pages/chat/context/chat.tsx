import React, { useEffect, useMemo, useState } from "react";
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

type ChatContextProp = {
  user: User;
  inbox: Inbox[];
  participantMessages: Message[];
  firstOpenChat: boolean;
  activeChat?: Inbox;
  onChangeChat: (chat: Inbox) => void;
  onFirstOpenChat: (condition: boolean) => void;
  onSendMessage: (message: MessagePayload) => void;
  onUploadFile: (file: File, msg: string, type: string) => void;
};

const initialValue: ChatContextProp = {
  user: { name: "Jazim Abbas", image: "/assets/images/girl.jpeg" },
  inbox,
  participantMessages: getMessages(),
  firstOpenChat: false,
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
};

export const ChatContext = React.createContext<ChatContextProp>(initialValue);

export default function ChatProvider(props: { children: any }) {
  const { children } = props;

  const [user] = useState<User>(initialValue.user);
  const [inbox, setInbox] = useState<Inbox[]>(initialValue.inbox);
  const [activeChat, setActiveChat] = useState<Inbox>();
  const [participantMessages, setMessages] = useState<Message[]>(initialValue.participantMessages);
  const [firstOpenChat, setFirstOpenChat] = useState(false);
  const baseURL = 'http://localhost:3000';

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
                    : new Date(value.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
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
   const fetchInbox = () => {
    axios
      .get(`${baseURL}/message-inbox`)
      .then((response) => {
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
                ? value.message_text.slice(0, 50 - 1) + "...."
                : value.message_text,
            timestamp: timeStamp,
            messageStatus: value.message_status === 1 ? "READ" : "DELIVERED",
            notificationsCount: value.unread_msg,
          };
          newInbox.push(data);

          // Fetch messages for active chat if conditions are met
          if (data.participantId === activeChat?.participantId && value.message_status === 0) {
            fetchMessages(data.participantId);
          }
        });
        setInbox(newInbox);
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  // Function to initialize EventSource and handle events
  const initializeEventSource = () => {
    const eventSource = new EventSource(`${baseURL}/event-check-inbox`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("EventSource Data:", data);

      // Trigger fetchInbox when the result is true (lastId changed)
      if (data.changed) {
        console.log("Change detected. Fetching inbox...");
        fetchInbox();
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      eventSource.close(); // Close connection on error
    };

    return () => {
      eventSource.close(); // Cleanup when the component unmounts
    };
  };

  // UseEffect to handle EventSource
  useEffect(() => {
    const cleanupEventSource = initializeEventSource();

    return cleanupEventSource; // Cleanup function
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
        onChangeChat: handleChangeChat,
        onSendMessage: handleSendMessage,
        onUploadFile: handleFileUpload,
        onFirstOpenChat: handleFirstOpenChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => React.useContext(ChatContext);
