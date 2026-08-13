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
  QuotedMessageAuthor,
  QuotedMessagePreview,
  QuotedMessageText,
  ReplyActionButton,
  TemplateMessageTooltip,
} from "./styles";
import { useChatContext } from "pages/chat/context/chat";

/* ----------------------- Minimal Tool Row (with collapse) ----------------------- */

type ToolEventRowProps = {
  id: string;
  isHighlighted?: boolean;
  functionName?: string;
  functionArgs?: string | null;
  toolOutput?: any;
};

const ToolEventRow = forwardRef<HTMLDivElement, ToolEventRowProps>((p, ref) => {
  const [argsOpen, setArgsOpen] = useState(false);
  const [outOpen, setOutOpen] = useState(false);

  const argText =
    typeof p.functionArgs === "string"
      ? p.functionArgs
      : p.functionArgs
        ? JSON.stringify(p.functionArgs)
        : "";

  const outText =
    typeof p.toolOutput === "string"
      ? p.toolOutput
      : p.toolOutput?.output != null
        ? String(p.toolOutput.output)
        : p.toolOutput
          ? JSON.stringify(p.toolOutput)
          : "";

  const collapsedBlock: CSSProperties = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "block",
  };
  const expandedBlock: CSSProperties = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    display: "block",
  };
  const smallBtn: CSSProperties = {
    marginLeft: 8,
    fontSize: 11,
    padding: "2px 6px",
    borderRadius: 4,
    border: "1px solid #d0d7de",
    background: "#fff",
    cursor: "pointer",
  };

  // show "" when empty string
  const renderWithQuotes = (s: string) => (s === "" ? '""' : s);

  return (
    <div
      id={p.id}
      ref={ref}
      style={{
        margin: "8px 0",
        padding: "10px 12px",
        borderRadius: 8,
        background: p.isHighlighted ? "#FFF8E1" : "#F5F7FB",
        border: p.isHighlighted ? "1px solid #FFD700" : "1px solid #E4E8F0",
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <div style={{ marginBottom: 6 }}>
        <strong>Tool call:</strong> <code>{p.functionName || ""}</code>
      </div>

      <div style={{ marginTop: 4 }}>
        <strong>Arguments:</strong>
        <button type="button" style={smallBtn} onClick={() => setArgsOpen((v) => !v)}>
          {argsOpen ? "Collapse" : "Expand"}
        </button>
        <code style={argsOpen ? expandedBlock : collapsedBlock}>{renderWithQuotes(argText)}</code>
      </div>

      <div style={{ marginTop: 4 }}>
        <strong>Output:</strong>
        <button type="button" style={smallBtn} onClick={() => setOutOpen((v) => !v)}>
          {outOpen ? "Collapse" : "Expand"}
        </button>
        <code style={outOpen ? expandedBlock : collapsedBlock}>{renderWithQuotes(outText)}</code>
      </div>
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
  const [focusedMessageId, setFocusedMessageId] = useState("");

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

  const scrollToMessage = (messageId?: string) => {
    if (!messageId) return;
    const targetMessage = messageRefs.current[messageId];
    if (!targetMessage) return;

    targetMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    setFocusedMessageId(messageId);
    window.setTimeout(() => setFocusedMessageId((current) => (current === messageId ? "" : current)), 1400);
  };

  // ===== waId handling for media URLs =====
  const baseURL = (process.env.REACT_APP_API_URL ?? "").replace(/\/+$/, "");
  const selectedWaId = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const fromQuery = qs.get("waId");
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
    return localStorage.getItem("wa:selectedId") || "";
  }, [location.search]);

  const isAbsolute = (u?: string) => !!u && /^(https?:)?\/\//i.test(u);

  const withWaId = (url: string): string => {
    if (!selectedWaId) return url;
    const hasQuery = url.includes("?");
    const sep = hasQuery ? "&" : "?";
    if (/\bwaId=/.test(url)) return url;
    return `${url}${sep}waId=${encodeURIComponent(selectedWaId)}`;
  };

  const fullMediaUrl = (mediaLocation?: string): string => {
    if (!mediaLocation) return "";
    if (isAbsolute(mediaLocation)) return mediaLocation;
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

          // Minimal tool row (no chat bubble)
          if (message.messageType === "tool") {
            return (
              <ToolEventRow
                key={message.id}
                id={message.id}
                ref={saveRef}
                isHighlighted={isSearchOpen && message.id === selectedSearchId}
                functionName={message.functionName}
                functionArgs={message.functionArgs}
                toolOutput={message.toolOutput}
              />
            );
          }

          // Default chat bubble
          return (
            <SingleMessage
              key={message.id}
              message={message}
              ref={saveRef}
              isHighlighted={(isSearchOpen && message.id === selectedSearchId) || focusedMessageId === message.id}
              mediaUrl={fullMediaUrl(message.mediaLocation)}
              onQuotedMessageClick={scrollToMessage}
              onReplyToMessage={chatCtx.onReplyToMessage}
            />
          );
        })}
      </MessageGroup>
    </Container>
  );
}

/* ----------------------- Single Message (unchanged) ----------------------- */

const SingleMessage = forwardRef(
  (
    props: {
      message: Message;
      isHighlighted?: boolean;
      mediaUrl?: string;
      onQuotedMessageClick?: (messageId?: string) => void;
      onReplyToMessage?: (message: Message) => void;
    },
    ref: any
  ) => {
    const { message, isHighlighted, mediaUrl = "", onQuotedMessageClick, onReplyToMessage } = props;
    const [isModalOpen, setModalOpen] = useState(false);
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
    const closeModal = () => setModalOpen(false);
    const closeTemplateModal = () => setTemplateModalOpen(false);

    const fileName = message.mediaLocation
      ? message.mediaLocation.substring(message.mediaLocation.lastIndexOf("/") + 1)
      : "";

    const participantStatus = String((message as any).participantMessageStatus ?? (message as any).participant_message_status ?? "")
      .toLowerCase();

    const isFailed = message.messageStatus === "failed";
    const quotedMessage = message.quotedMessage;
    const hasQuotedTarget = Boolean(quotedMessage?.id && !quotedMessage.missing);
    const quotedAuthor = quotedMessage?.missing
      ? "Quoted message"
      : quotedMessage?.fromMe === 1
        ? "You"
        : quotedMessage?.participantName || "Customer";
    const quotedText = getQuotedMessageText(quotedMessage);
    const templateTooltipId = `template-message-${message.id}-tooltip`;

    const errorTitles = useMemo(() => {
      if (!isFailed) return [];
      const errs = Array.isArray((message as any).errors) ? (message as any).errors : [];
      return errs
        .map((e: any) => (typeof e?.title === "string" ? e.title.trim() : ""))
        .filter(Boolean);
    }, [isFailed, (message as any).errors]);

    useEffect(() => {
      if (!isModalOpen && !isTemplateModalOpen) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          closeModal();
          closeTemplateModal();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen, isTemplateModalOpen]);

    const openTemplatePreview = (event: React.MouseEvent<HTMLDivElement>) => {
      if (message.messageType !== "template" || !message.templateMessageText) return;
      if ((event.target as HTMLElement).closest("button, a")) return;
      setTemplateModalOpen(true);
    };

    const handleTemplatePreviewKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (message.messageType !== "template" || !message.templateMessageText) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setTemplateModalOpen(true);
    };

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
          tabIndex={message.messageType === "template" && message.templateMessageText ? 0 : undefined}
          aria-describedby={
            message.messageType === "template" && message.templateMessageText
              ? templateTooltipId
              : undefined
          }
          onClick={openTemplatePreview}
          onKeyDown={handleTemplatePreviewKeyDown}
        >
          {message.messageType === "template" && message.templateMessageText && (
            <TemplateMessageTooltip id={templateTooltipId} role="tooltip">
              {message.templateMessageText}
            </TemplateMessageTooltip>
          )}
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

          {message.messageId && (
            <ReplyActionButton
              type="button"
              aria-label="Reply to message"
              title="Reply to message"
              onClick={() => onReplyToMessage?.(message)}
            >
              Reply
            </ReplyActionButton>
          )}

          {quotedMessage && (
            <QuotedMessagePreview
              type="button"
              disabled={!hasQuotedTarget}
              title={hasQuotedTarget ? "Jump to quoted message" : "Quoted message is not available"}
              onClick={() => onQuotedMessageClick?.(quotedMessage.id)}
            >
              <QuotedMessageAuthor>{quotedAuthor}</QuotedMessageAuthor>
              <QuotedMessageText>{quotedText}</QuotedMessageText>
            </QuotedMessagePreview>
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

          {isFailed && errorTitles.length > 0 && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                lineHeight: 1.4,
                color: "#b42318",
                fontWeight: 600,
                wordBreak: "break-word",
              }}
            >
              {errorTitles.join(" · ")}
            </div>
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
                className={`chat__msg-status-icon ${message.messageStatus === "read" ? "chat__msg-status-icon--blue" : ""
                  }`}
              />
            )}
          </ChatMessageFooter>
        </ChatMessage>

        {isTemplateModalOpen && message.templateMessageText && (
          <div style={modalStyles.overlay} onClick={closeTemplateModal}>
            <div
              style={modalStyles.templateModalContent}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`template-message-${message.id}-title`}
            >
              <div style={modalStyles.templateModalHeader}>
                <strong id={`template-message-${message.id}-title`}>Template message</strong>
                <button
                  type="button"
                  style={modalStyles.templateCloseButton}
                  onClick={closeTemplateModal}
                  aria-label="Close template message preview"
                >
                  ×
                </button>
              </div>
              <div style={modalStyles.templateMessageBody}>{message.templateMessageText}</div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div style={modalStyles.overlay} onClick={closeModal}>
            <div
              style={modalStyles.modalContent}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Image preview"
            >
              <button
                type="button"
                style={modalStyles.closeButton}
                onClick={closeModal}
                aria-label="Close image preview"
              >
                ×
              </button>
              <img src={mediaUrl} alt="Preview" style={modalStyles.image} />
            </div>
          </div>
        )}
      </>
    );
  }
);
SingleMessage.displayName = "SingleMessage";

function getQuotedMessageText(quotedMessage?: Message["quotedMessage"]): string {
  if (!quotedMessage) return "";

  const body = String(quotedMessage.body || "")
    .replace(/\s*\.\s*Image url:\s*https?:\/\/\S+/gi, "")
    .replace(/\s*\.\s*Audio url:\s*https?:\/\/\S+/gi, "")
    .trim();

  if (body) return body;
  if (quotedMessage.missing) return "Original message is not available";

  switch (quotedMessage.messageType) {
    case "image":
      return "Photo";
    case "document":
      return "Document";
    case "audio":
      return "Audio";
    case "template":
      return "Template message";
    default:
      return "Message";
  }
}

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
    position: "relative",
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
  templateModalContent: {
    width: "min(520px, calc(100vw - 32px))",
    maxHeight: "min(720px, calc(100vh - 48px))",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: "#111b21",
    color: "#f0f2f5",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: 12,
    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
  },
  templateModalHeader: {
    minHeight: 48,
    padding: "0 8px 0 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  templateCloseButton: {
    width: 40,
    height: 40,
    padding: 0,
    border: 0,
    borderRadius: "50%",
    background: "transparent",
    color: "#f0f2f5",
    cursor: "pointer",
    fontSize: 28,
    lineHeight: "40px",
  },
  templateMessageBody: {
    padding: 16,
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontSize: 14,
    lineHeight: 1.55,
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    borderRadius: "8px",
  },
  closeButton: {
    position: "absolute",
    top: "-44px",
    right: 0,
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "999px",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    color: "#fff",
    fontSize: "26px",
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
