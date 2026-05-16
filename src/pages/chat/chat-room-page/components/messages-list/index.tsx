import { CSSProperties, forwardRef, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import Icon from "common/components/icons";
import useScrollToBottom from "./hooks/useScrollToBottom";
import { Message } from "./data/get-messages";
import {
  ChatMessage,
  ChatMessageFiller,
  ChatMessageFooter,
  Container,
  EncryptionMessage,
  MessageGroup,
} from "./styles";

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

  const params = useParams();

  const { containerRef } = useScrollToBottom(
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
        {props.listMessages.map((message) =>
          message.messageType === "tool" ? (
            <ToolEventRow
              key={message.id}
              ref={(el) => {
                messageRefs.current[message.id] = el as HTMLDivElement | null;
              }}
              id={message.id}
              functionName={message.functionName}
              functionArgs={message.functionArgs}
              toolOutput={message.toolOutput}
              timestamp={message.timestamp}
              isHighlighted={isSearchOpen && message.id === selectedSearchId}
            />
          ) : (
            <SingleMessage
              key={message.id}
              message={message}
              ref={(el) => {
                messageRefs.current[message.id] = el as HTMLDivElement | null;
              }}
              isHighlighted={isSearchOpen && message.id === selectedSearchId}
            />
          )
        )}
      </MessageGroup>
    </Container>
  );
}

const ToolEventRow = forwardRef(
  (
    props: {
      id: string;
      timestamp?: string;
      functionName?: string;
      functionArgs?: string | null;
      toolOutput?: any;
      isHighlighted?: boolean;
    },
    ref: any
  ) => {
    const { id, timestamp, functionName, functionArgs, toolOutput, isHighlighted } = props;
    const [argsOpen, setArgsOpen] = useState(false);
    const [outOpen, setOutOpen] = useState(false);

    const argText =
      typeof functionArgs === "string"
        ? functionArgs
        : functionArgs
          ? JSON.stringify(functionArgs)
          : "";

    const outText =
      typeof toolOutput === "string"
        ? toolOutput
        : toolOutput?.output != null
          ? String(toolOutput.output)
          : toolOutput
            ? JSON.stringify(toolOutput)
            : "";

    const collapsedBlock: CSSProperties = {
      whiteSpace: "pre-wrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "block",
      maxWidth: "100%",
      minWidth: 0,
      wordBreak: "break-word",
      overflowWrap: "anywhere",
      lineHeight: 1.5,
      maxHeight: 72,
    };
    const expandedBlock: CSSProperties = {
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      overflowWrap: "anywhere",
      display: "block",
      maxWidth: "100%",
      minWidth: 0,
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

    const renderWithQuotes = (text: string) => (text === "" ? '""' : text);
    const previewText = (text: string, limit: number = 280) => {
      if (text.length <= limit) return renderWithQuotes(text);
      return `${renderWithQuotes(text.slice(0, limit))}...`;
    };

    const renderedArgsText = argsOpen ? renderWithQuotes(argText) : previewText(argText);
    const renderedOutText = outOpen ? renderWithQuotes(outText) : previewText(outText);

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
          fontSize: 12,
          lineHeight: 1.5,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 6,
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
            <strong>Tool call:</strong> <code>{functionName || ""}</code>
          </div>
          <span style={{ color: "#667085", whiteSpace: "nowrap" }}>{timestamp}</span>
        </div>

        <div style={{ marginTop: 4, minWidth: 0 }}>
          <strong>Arguments:</strong>
          <button type="button" style={smallBtn} onClick={() => setArgsOpen((value) => !value)}>
            {argsOpen ? "Collapse" : "Expand"}
          </button>
          <code style={argsOpen ? expandedBlock : collapsedBlock}>
            {renderedArgsText}
          </code>
        </div>

        <div style={{ marginTop: 4, minWidth: 0 }}>
          <strong>Output:</strong>
          <button type="button" style={smallBtn} onClick={() => setOutOpen((value) => !value)}>
            {outOpen ? "Collapse" : "Expand"}
          </button>
          <code
            style={{
              ...(outOpen ? expandedBlock : collapsedBlock),
              maxHeight: outOpen ? 240 : undefined,
              overflowY: outOpen ? "auto" : "hidden",
            }}
          >
            {renderedOutText}
          </code>
        </div>
      </div>
    );
  }
);

ToolEventRow.displayName = "ToolEventRow";

const SingleMessage = forwardRef((props: { message: Message, isHighlighted?: boolean }, ref: any) => {
  const { message, isHighlighted } = props;
  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility
  const baseURL = process.env.REACT_APP_API_URL ?? "";
  const closeModal = () => setModalOpen(false);
  const isFailed = message.messageStatus === "failed";
  const errorTitles = isFailed && Array.isArray(message.errors)
    ? message.errors
      .map((error) => (typeof error?.title === "string" ? error.title.trim() : ""))
      .filter(Boolean)
    : [];
  // Determine the full URL for media
  const mediaUrl =
    message.mediaLocation?.startsWith("http://") || message.mediaLocation?.startsWith("https://")
      ? message.mediaLocation
      : `${baseURL}/${message.mediaLocation}`;

  const fileName = message.mediaLocation
    ? message.mediaLocation.substring(message.mediaLocation.lastIndexOf('/') + 1)
    : "";

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

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
              position: "absolute",           // 2️⃣ absolutely position the badge
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
            style={{
              textDecoration: "underline",
              fontWeight: "bold",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {fileName}
          </a>
        ) : (
          <span
            style={{
              display: "block",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            {message.body}
          </span>
        )}
        {errorTitles.length > 0 && (
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
          <span>{message.timestamp}</span>
          {!message.isOpponent && (
            <Icon
              id={
                message.messageStatus === 'failed'
                  ? 'cross'
                  : (message.messageStatus === 'delivered' || message.messageStatus === 'read')
                    ? 'doubleTick'
                    : 'singleTick'
              }
              className={`chat__msg-status-icon ${message.messageStatus === 'read' ? 'chat__msg-status-icon--blue' : ''
                }`}
            />
          )}
        </ChatMessageFooter>
      </ChatMessage>

      {/* Modal for Image Preview */}
      {isModalOpen && (
        <div style={modalStyles.overlay} onClick={closeModal}>
          <div style={modalStyles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Image preview">
            <button type="button" style={modalStyles.closeButton} onClick={closeModal} aria-label="Close image preview">
              ×
            </button>
            <img
              src={mediaUrl}
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
    position: "relative",
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
    maxWidth: "100%", // Ensure the image fits within the modal
    maxHeight: "100%", // Ensure the image fits within the modal
    objectFit: "contain", // Scale the image while maintaining aspect ratio
    borderRadius: "8px", // Optional rounded corners
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
