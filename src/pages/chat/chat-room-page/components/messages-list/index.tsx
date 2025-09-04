import { CSSProperties, forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom"; // ⬅️ useLocation added

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
  const chatCtx = useChatContext();
  const params = useParams();
  const location = useLocation(); // ⬅️

  const { containerRef, lastMessageRef } = useScrollToBottom(
    onShowBottomIcon,
    shouldScrollToBottom,
    params.id,
    testToBottom
  );

  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (selectedSearchId && selectedSearchId !== "" && isSearchOpen) {
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
  }, [selectedSearchId, isSearchOpen, shouldScrollToBottom, lastMessageId]);

  // ===== waId handling for media URLs =====
  const baseURL = (process.env.REACT_APP_API_URL ?? "").replace(/\/+$/, "");
  const selectedWaId = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const fromQuery = qs.get("waId");
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
    // fallback to saved selection (Sidebar stores this)
    return localStorage.getItem("wa:selectedId") || "";
  }, [location.search]);

  const isAbsolute = (u?: string) => !!u && /^(https?:)?\/\//i.test(u);

  const withWaId = (url: string): string => {
    if (!selectedWaId) return url;
    const hasQuery = url.includes("?");
    const sep = hasQuery ? "&" : "?";
    // avoid duplicate waId
    if (/\bwaId=/.test(url)) return url;
    return `${url}${sep}waId=${encodeURIComponent(selectedWaId)}`;
  };

  const fullMediaUrl = (mediaLocation?: string): string => {
    if (!mediaLocation) return "";
    if (isAbsolute(mediaLocation)) {
      // absolute (e.g., S3) — don't touch
      return mediaLocation;
    }
    // relative path served by your backend — append waId
    const abs = `${baseURL}/${mediaLocation.replace(/^\/+/, "")}`;
    return withWaId(abs);
  };

  return (
    <Container ref={containerRef}>
      <EncryptionMessage>
        <Icon id="lock" className="icon" />
        Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read
        or listen to them. Click to learn more.
      </EncryptionMessage>

      <MessageGroup>
        {props.listMessages.map((message, index) => (
          <SingleMessage
            key={message.id}
            message={message}
            ref={(el) => {
              messageRefs.current[message.id] = el as HTMLDivElement | null;
            }}
            isHighlighted={isSearchOpen && message.id === selectedSearchId}
            mediaUrl={fullMediaUrl(message.mediaLocation)} // ⬅️ pass computed URL with waId
          />
        ))}
      </MessageGroup>
    </Container>
  );
}

// Extend SingleMessage props to receive computed mediaUrl
const SingleMessage = forwardRef(
  (
    props: { message: Message; isHighlighted?: boolean; mediaUrl?: string },
    ref: any
  ) => {
    const { message, isHighlighted, mediaUrl = "" } = props;
    const [isModalOpen, setModalOpen] = useState(false);

    // Nice filename for documents
    const fileName = message.mediaLocation
      ? message.mediaLocation.substring(message.mediaLocation.lastIndexOf("/") + 1)
      : "";

    return (
      <>
        <ChatMessage
          key={message.id}
          className={message.isOpponent ? "chat__msg--received" : "chat__msg--sent"}
          ref={ref}
          style={{
            position: "relative",
            border: isHighlighted ? "1px solid #FFD700" : "none",
            paddingLeft: message.messageType === "template" ? "30px" : undefined,
          }}
        >
          {message.messageType === "template" && (
            <div
              style={{
                position: "absolute",
                left: 4,
                top: "50%",
                transform: "translateY(-50%)",
                width: 20,
                height: 20,
                backgroundColor: "#eee",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: "bold",
                color: "#333",
              }}
            >
              T
            </div>
          )}

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
              style={{ textDecoration: "underline", fontWeight: "bold" }}
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
                id={
                  message.messageStatus === "failed"
                    ? "cross"
                    : message.messageStatus === "delivered" || message.messageStatus === "read"
                    ? "doubleTick"
                    : "singleTick"
                }
                className={`chat__msg-status-icon ${
                  message.messageStatus === "read" ? "chat__msg-status-icon--blue" : ""
                }`}
              />
            )}
          </ChatMessageFooter>
        </ChatMessage>

        {/* Modal for Image Preview */}
        {isModalOpen && (
          <div style={modalStyles.overlay} onClick={() => setModalOpen(false)}>
            <div style={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
              <img src={mediaUrl} alt="Preview" style={modalStyles.image} />
            </div>
          </div>
        )}
      </>
    );
  }
);

const modalStyles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    padding: "0",
    borderRadius: "10px",
    maxWidth: "60%",
    maxHeight: "60%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    backgroundColor: "transparent",
  },
  image: {
    maxWidth: "50%",
    maxHeight: "50%",
    objectFit: "contain",
    borderRadius: "8px",
  },
};