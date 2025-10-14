import { CSSProperties, forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import Icon from "common/components/icons";
import useScrollToBottom from "./hooks/useScrollToBottom";
import { Message } from "./data/get-messages";
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

/* ----------------------- Helpers ----------------------- */

function pretty(obj: any) {
  try {
    if (typeof obj === "string") return JSON.stringify(JSON.parse(obj), null, 2);
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj ?? "");
  }
}

/* ----------------------- Tool Row ----------------------- */

type ToolEventRowProps = {
  id: string;
  isHighlighted?: boolean;
  timestamp?: string;
  functionName?: string;
  functionArgs?: string | null;
  chatResponseItem?: any;
  toolOutput?: any;
};

const ToolEventRow = forwardRef<HTMLDivElement, ToolEventRowProps>((toolProps, ref) => {
  const { id, isHighlighted, timestamp, functionName, functionArgs, chatResponseItem, toolOutput } =
    toolProps;

  return (
    <div
      id={id}
      ref={ref}
      style={{
        margin: "8px 0",
        padding: "10px 12px",
        borderRadius: 8,
        background: isHighlighted ? "#FFF8E1" : "#F5F7FB",
        border: isHighlighted ? "1px solid #FFD700" : "1px solid #E4E8F0",
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      <div style={{ fontSize: 12, color: "#556", marginBottom: 6 }}>
        <strong>🔧 Tool call</strong>
        {functionName ? (
          <>
            : <code>{functionName}</code>
          </>
        ) : null}
        {timestamp ? <span style={{ float: "right", color: "#889" }}>{timestamp}</span> : null}
      </div>

      <details open>
        <summary style={{ cursor: "pointer", userSelect: "none" }}>Chat response (raw)</summary>
        <pre style={{ margin: "6px 0 0", fontSize: 12 }}>{pretty(chatResponseItem)}</pre>
      </details>

      {functionArgs ? (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer", userSelect: "none" }}>Arguments</summary>
          <pre style={{ marginTop: 6, fontSize: 12 }}>{pretty(functionArgs)}</pre>
        </details>
      ) : null}

      {toolOutput ? (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer", userSelect: "none" }}>Tool Output</summary>
          <pre style={{ marginTop: 6, fontSize: 12 }}>{pretty(toolOutput)}</pre>
        </details>
      ) : null}
    </div>
  );
});
ToolEventRow.displayName = "ToolEventRow";

/* ----------------------- Props ----------------------- */

type MessagesListProps = {
  onShowBottomIcon: Function;
  listMessages: Message[];
  isSearchOpen: boolean;
  lastMessageId: string;
  shouldScrollToBottom?: boolean;
  testToBottom?: boolean;
  selectedSearchId?: string;
};

/* ----------------------- Component ----------------------- */

export default function MessagesList({
  onShowBottomIcon,
  shouldScrollToBottom,
  testToBottom,
  selectedSearchId,
  isSearchOpen,
  lastMessageId,
  listMessages,
}: MessagesListProps) {
  const chatCtx = useChatContext();
  const params = useParams();
  const location = useLocation();

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
        {listMessages.map((message) => {
          const saveRef = (el: HTMLDivElement | null) => {
            messageRefs.current[message.id] = el;
          };

          // Render tool calls WITHOUT chat bubble
          if (message.messageType === "tool") {
            return (
              <ToolEventRow
                key={message.id}
                id={message.id}
                ref={saveRef}
                isHighlighted={isSearchOpen && message.id === selectedSearchId}
                timestamp={message.timestamp}
                functionName={message.functionName}
                functionArgs={message.functionArgs}
                chatResponseItem={message.chatResponseItem}
                toolOutput={message.toolOutput}
              />
            );
          }

          // Default: normal chat bubble (text/image/document/template)
          return (
            <SingleMessage
              key={message.id}
              message={message}
              ref={saveRef}
              isHighlighted={isSearchOpen && message.id === selectedSearchId}
              mediaUrl={fullMediaUrl(message.mediaLocation)}
            />
          );
        })}
      </MessageGroup>
    </Container>
  );
}

/* ----------------------- Single Message (unchanged) ----------------------- */

// Extend SingleMessage props to receive computed mediaUrl
const SingleMessage = forwardRef(
  (props: { message: Message; isHighlighted?: boolean; mediaUrl?: string }, ref: any) => {
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
            <span title={message.fullTimestamp || ""}>{message.timestamp}</span>
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
SingleMessage.displayName = "SingleMessage";

/* ----------------------- Modal Styles ----------------------- */

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
