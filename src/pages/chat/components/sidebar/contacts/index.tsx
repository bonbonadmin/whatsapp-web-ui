// /pages/chat/components/sidebar/contacts/index.tsx
import { useState } from "react";
import Icon from "common/components/icons";
import { Inbox } from "common/types/common.type";
import {
  Avatar,
  AvatarWrapper,
  BottomContent,
  Contact,
  Content,
  MessageStatusIcon,
  MessageWrapper,
  Name,
  Subtitle,
  Time,
  TopContent,
  UnreadContact,
} from "./styles";

type InboxContactProps = {
  inbox: Inbox;
  onChangeChat?: (chat: Inbox) => void;
  isActive?: boolean;
  onTogglePin?: (participantId: string, next: boolean) => void; // <- used by chevron
};

export default function InboxContact(props: InboxContactProps) {
  const { onChangeChat, isActive, onTogglePin } = props;
  const { name, lastMessage, image, timestamp } = props.inbox;

  const [hovered, setHovered] = useState(false);

  const handleChangeChat = () => {
    onChangeChat?.(props.inbox);
  };

  return (
    <Contact
      isActive={isActive}
      onClick={handleChangeChat}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative" }}
    >
      {/* <AvatarWrapper>
        <Avatar src={image} />
      </AvatarWrapper> */}
      <Content>
        <TopContent>
          <Name>{name}</Name>
          {timestamp && lastMessage ? (
            <Time>{timestamp}</Time>
          ) : (
            <Trailing
              {...props.inbox}
              showChevron={hovered}
              onTogglePin={onTogglePin}
            />
          )}
        </TopContent>

        <BottomContent>
          <MessageWrapper>
            <Message {...props.inbox} />
          </MessageWrapper>

          {timestamp && lastMessage && (
            <Trailing
              {...props.inbox}
              showChevron={hovered}
              onTogglePin={onTogglePin}
            />
          )}
        </BottomContent>
      </Content>
    </Contact>
  );
}

function Message(props: Pick<Inbox, "messageStatus" | "lastMessage">) {
  const { lastMessage, messageStatus } = props;
  if (!lastMessage) return <></>;

  return (
    <>
      <MessageStatusIcon
        isRead={messageStatus === "READ"}
        id={messageStatus === "SENT" ? "singleTick" : "doubleTick"}
      />
      <Subtitle>{lastMessage}</Subtitle>
    </>
  );
}

type TrailingProps = Pick<
  Inbox,
  "participantId" | "isPinned" | "notificationsCount"
> & {
  onTogglePin?: (participantId: string, next: boolean) => void;
  showChevron?: boolean;
};

function Trailing(props: TrailingProps) {
  const { participantId, isPinned, notificationsCount, onTogglePin, showChevron } = props;

  // robust boolean coercion (handles 0/1, "0"/"1", true/false, "true"/"false")
  const pinned =
    typeof isPinned === "boolean"
      ? isPinned
      : isPinned === 1 || isPinned === "1" || isPinned === "true";

  const chevronVisible = !!showChevron;

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(participantId, !pinned); // use the coerced boolean
  };

  return (
    <div
      className="sidebar-contact__icons"
      style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}
      onClick={(e) => e.stopPropagation()}
    >
      {pinned && <Icon id="pinned" className="sidebar-contact__icon" />}

      {notificationsCount !== undefined && Number(notificationsCount) > 0 && (
        <UnreadContact>{notificationsCount}</UnreadContact>
      )}

      {/* Hover-only chevron that toggles pin/unpin on click */}
      <button
        aria-label={isPinned ? "Unpin chat" : "Pin chat"}
        aria-pressed={!!isPinned}
        title={isPinned ? "Unpin" : "Pin"}
        onClick={handleChevronClick}
        className="sidebar-contact__btn"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          opacity: chevronVisible ? 1 : 0,
          pointerEvents: chevronVisible ? "auto" : "none",
          transition: "opacity 120ms ease",
        }}
      >
        <Icon id="downArrow" className="sidebar-contact__icon sidebar-contact__icon--dropdown" />
      </button>
    </div>
  );
}