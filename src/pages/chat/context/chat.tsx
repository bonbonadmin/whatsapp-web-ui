import React, { useEffect, useMemo, useState } from "react";
import { inbox } from "../data/inbox";
import { Inbox, InboxResponse } from "common/types/common.type";
import {
  getMessages,
  Message,
  MessageResponse,
  MessageTextPayload,
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
  onSendMessage: (message: MessageTextPayload) => void;
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

  // const handleSendMessage = (msg: MessageTextPayload) => {
  //   try {
  //     fetch("http://localhost:3000/message/send", {
  //       method: 'POST',
  //       body: JSON.stringify(msg),
  //       headers: {
  //         "Content-type": "application/json;",
  //       },
  //      })
  //      .then((response) => response.json())
  //      .then((data) => {
  //        fetchMessages(msg.to);
  //      })
  //     .catch((err) => {
  //       console.log(err.message);
  //     });
  //   } catch (error) {
  //     console.error('Error fetching messages list:', error);
  //   }
  // };

  const handleSendMessage = (msg: MessageTextPayload) => {
    try {
      axios
        .post("http://localhost:3000/message/send", msg)
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
        fetch("/message-inbox/" + id)
          .then((response) => response.json())
          .then((data) => {
            const newMessages: Message[] = [];
            if (data.data.length) {
              data.data.forEach((value: MessageResponse) => {
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
      fetch("/message-inbox")
        .then((response) => response.json())
        .then((data) => {
          const newInbox: Inbox[] = [];
          data.data.forEach((value: InboxResponse) => {
            const timeStamp =
              new Date(value.created_at).getHours() + ":" + new Date(value.created_at).getMinutes();
            const data: Inbox = {
              id: value.message_id,
              participantId: value.participant_id,
              name: value.participant_name ?? value.display_phone_number,
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

  return (
    <ChatContext.Provider
      value={{
        user,
        inbox,
        activeChat,
        participantMessages,
        onChangeChat: handleChangeChat,
        onSendMessage: handleSendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => React.useContext(ChatContext);
