import { CSSProperties, forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import Icon from "common/components/icons";
import useScrollToBottom from "./hooks/useScrollToBottom";
import { getMessages, Message, MessageResponse } from "./data/get-messages";
import {
  ChatMessage,
  ChatMessageFiller,
  ChatMessageFooter,
  Container,
  Date,
  DateWrapper,
  EncryptionMessage,
  MessageGroup,
} from "./styles";
import { useChatContext } from "pages/chat/context/chat";

type MessagesListProps = {
  onShowBottomIcon: Function;
  listMessages: Message[];
  isSearchOpen: boolean;
  lastMessageId: string;
  shouldScrollToBottom?: boolean;
  testToBottom?: boolean;
  selectedSearchId?: string;
};

export default function MessagesList(props: MessagesListProps) {
  const { onShowBottomIcon, shouldScrollToBottom, testToBottom, selectedSearchId, isSearchOpen, lastMessageId } = props;
  console.log("test to bottom", testToBottom);
  const chatCtx = useChatContext();

  const params = useParams();

  const { containerRef, lastMessageRef } = useScrollToBottom(
    onShowBottomIcon,
    shouldScrollToBottom,
    params.id,
    testToBottom
  );

  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (selectedSearchId  && selectedSearchId !== '' && isSearchOpen) {
      const targetMessage = messageRefs.current[selectedSearchId];
      if (targetMessage) {
        targetMessage.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    if (shouldScrollToBottom) {
      const targetMessage = messageRefs.current[lastMessageId];
      if (targetMessage) {
        targetMessage.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedSearchId, isSearchOpen, shouldScrollToBottom, lastMessageId])

  return (
    <Container ref={containerRef}>
      <EncryptionMessage>
        <Icon id="lock" className="icon" />
        Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read
        or listen to them. Click to learn more.
      </EncryptionMessage>
      {/* <DateWrapper>
        <Date> TODAY </Date>
      </DateWrapper> */}
      <MessageGroup>
        {props.listMessages.map((message, index) => {
          const isLastMessage = index === props.listMessages.length - 1;
          return (
            <SingleMessage
              key={message.id}
              message={message}
              ref={(el) => {
                messageRefs.current[message.id] = el as HTMLDivElement | null;
              }}
              isHighlighted={isSearchOpen && message.id === selectedSearchId}
            />
          );
        })}
      </MessageGroup>
    </Container>
  );
}

const SingleMessage = forwardRef((props: { message: Message, isHighlighted?: boolean }, ref: any) => {
  const { message, isHighlighted } = props;
  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility
  const baseURL = process.env.REACT_APP_API_URL ?? "";
  // Determine the full URL for media
  const mediaUrl =
    message.mediaLocation?.startsWith("http://") || message.mediaLocation?.startsWith("https://")
      ? message.mediaLocation
      : `${baseURL}/${message.mediaLocation}`;

  const fileName = message.mediaLocation
    ? message.mediaLocation.substring(message.mediaLocation.lastIndexOf('/') + 1)
    : "";

  return (
    <>
      <ChatMessage
        key={message.id}
        className={message.isOpponent ? "chat__msg--received" : "chat__msg--sent"}
        ref={ref}
        style={{
          border: isHighlighted ? "1px solid #FFD700" : "none",
        }}
      >
        {message.messageType === "image" ? (
          <div>
            <img
              src={mediaUrl}
              alt="img"
              style={{
                maxWidth: "200px",
                borderRadius: "8px",
                objectFit: "cover",
                cursor: "pointer",
              }}
              onClick={() => setModalOpen(true)}
            />
            <p>{message.body}</p>
          </div>
        ) : message.messageType === "document" ? (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              // color: "#0066cc", // Link color
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            {fileName}
          </a>
        ) : (
          <span>{message.body}</span>
        )}
        <ChatMessageFiller />
        <ChatMessageFooter>
          <span>{message.timestamp}</span>
          {!message.isOpponent && (
            <Icon
              id={`${message.messageStatus === "SENT" ? "singleTick" : "doubleTick"}`}
              className={`chat__msg-status-icon ${
                message.messageStatus === "READ" ? "chat__msg-status-icon--blue" : ""
              }`}
            />
          )}
        </ChatMessageFooter>
      </ChatMessage>

      {/* Modal for Image Preview */}
      {isModalOpen && (
        <div style={modalStyles.overlay} onClick={() => setModalOpen(false)}>
          <div style={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={`${baseURL}/${message.mediaLocation}`}
              alt="Preview"
              style={modalStyles.image}
            />
          </div>
        </div>
      )}
    </>
  );
});

const modalStyles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Dimmed background
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    padding: "0", // Remove padding
    borderRadius: "10px",
    maxWidth: "60%", // Limit modal width
    maxHeight: "60%", // Limit modal height
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    backgroundColor: "transparent", // Make the background transparent
  },
  image: {
    maxWidth: "50%", // Ensure the image fits within the modal
    maxHeight: "50%", // Ensure the image fits within the modal
    objectFit: "contain", // Scale the image while maintaining aspect ratio
    borderRadius: "8px", // Optional rounded corners
  },
};
