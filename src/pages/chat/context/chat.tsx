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
  activeChat?: Inbox;
  onChangeChat: (chat: Inbox) => void;
  onSendMessage: (message: MessagePayload) => void;
  onUploadImage: (file: File) => void;
};

const initialValue: ChatContextProp = {
  user: { name: "Jazim Abbas", image: "/assets/images/girl.jpeg" },
  inbox,
  participantMessages: getMessages(),
  onChangeChat() {
    throw new Error();
  },
  onSendMessage() {
    throw new Error();
  },
  onUploadImage() {
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

  const handleChangeChat = (chat: Inbox) => {
    setActiveChat(chat);
    fetchMessages(chat.participantId);
  };

  const handleSendMessage = (msg: MessagePayload) => {
    try {
      const payload = {
        to: msg.to,
        textMessage: msg.textMessage,
        mediaType: msg.mediaType,
        mediaId: msg.mediaId ?? null,
        filePath: msg.filePath ?? null,
      };

      axios
        .post("https://wa-svc.bonbon.co.id/message/send", payload)
        .then((response) => fetchMessages(msg.to))
        .catch((err) => {
          console.log(err.message);
        });
    } catch (error) {
      console.error("Error fetching messages list:", error);
    }
  };

  const fetchMessages = useMemo(
    () => async (id: any) => {
      try {
        axios
        .get("https://wa-svc.bonbon.co.id/message-inbox/" + id)
          .then((response) => {
            const newMessages: Message[] = [];
            if (response.data.data.length) {
              response.data.data.forEach((value: MessageResponse) => {
                const timeStamp =
                  new Date(value.created_at).getHours() +
                  ":" +
                  new Date(value.created_at).getMinutes();
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      axios
        .get("https://wa-svc.bonbon.co.id/message-inbox")
        .then((response) => {
          const newInbox: Inbox[] = [];
          response.data.data.forEach((value: InboxResponse) => {
            const timeStamp =
              new Date(value.created_at).getHours() + ":" + new Date(value.created_at).getMinutes();
            const data: Inbox = {
              id: value.message_id,
              participantId: value.participant_id,
              name: value.participant_name ?? value.participant_id,
              image: "/assets/images/boy4.jpeg",
              lastMessage: value.message_text,
              timestamp: timeStamp,
              messageStatus: value.message_status === 1 ? "READ" : "DELIVERED",
              notificationsCount: value.unread_msg,
            };
            newInbox.push(data);
          });
          setInbox(newInbox);
        })
        .catch((err) => {
          console.log(err.message);
        });
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers = {
        "Content-Type": "multipart/form-data",
      };

      const uploadMedia = await axios.post("https://wa-svc.bonbon.co.id/message/uploadMedia", formData, {
        headers,
      });
      console.log(uploadMedia);

      const payload = {
        to: activeChat?.participantId,
        textMessage: "",
        mediaType: "image",
        mediaId: uploadMedia.data.mediaId,
        filePath: uploadMedia.data.filePath,
      };
      console.log(payload);

      await axios.post("https://wa-svc.bonbon.co.id/message/send", payload);
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
        onChangeChat: handleChangeChat,
        onSendMessage: handleSendMessage,
        onUploadImage: handleFileUpload,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => React.useContext(ChatContext);
