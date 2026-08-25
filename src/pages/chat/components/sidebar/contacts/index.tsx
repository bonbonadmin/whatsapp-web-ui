// /pages/chat/components/sidebar/contacts/index.tsx
import { useState } from "react";
import Icon from "common/components/icons";
import { Inbox } from "common/types/common.type";
import {
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
  onTogglePin?: (participantId: string, next: boolean, waId?: string) => void;
};

export default function InboxContact(props: InboxContactProps) {
  const { onChangeChat, isActive, onTogglePin } = props;
  const { name, lastMessage, timestamp } = props.inbox;

  function toLocalInboxTime(input: string | number | Date): string {
    if (input == null) return "";
    let d: Date;

    // numbers: epoch seconds or ms
    if (typeof input === "number") {
      d = new Date(input < 1e12 ? input * 1000 : input);
    } else if (input instanceof Date) {
      d = input;
    } else {
      const s = String(input).trim();
      // handle "YYYY-MM-DD HH:mm:ss" as UTC
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
        d = new Date(s.replace(" ", "T") + "Z");
      } else {
        d = new Date(s); // ISO with Z/offset or other parseable forms
      }
    }

    if (isNaN(d.getTime())) return "";

    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    return sameDay
      ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) // local TZ
      : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  }
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
            <Time>{toLocalInboxTime(timestamp)}</Time>
          ) : (
            <Trailing {...props.inbox} showChevron={hovered} onTogglePin={onTogglePin} />
          )}
        </TopContent>

        <BottomContent>
          <MessageWrapper>
            <Message {...props.inbox} />
          </MessageWrapper>

          {timestamp && lastMessage && (
            <Trailing {...props.inbox} showChevron={hovered} onTogglePin={onTogglePin} />
          )}
        </BottomContent>
      </Content>
    </Contact>
  );
}

type SidebarMessageVisual = {
  iconId?: "singleTick" | "doubleTick" | "cross";
  isRead: boolean;
  isFailed: boolean;
};

function getSidebarMessageVisual(
  fromMe?: number,
  lastMessageStatus?: Inbox["lastMessageStatus"]
): SidebarMessageVisual {
  if (fromMe === 0) {
    return { iconId: undefined, isRead: false, isFailed: false };
  }

  if (lastMessageStatus === "read") {
    return { iconId: "doubleTick", isRead: true, isFailed: false };
  }

  if (lastMessageStatus === "delivered") {
    return { iconId: "doubleTick", isRead: false, isFailed: false };
  }

  if (lastMessageStatus === "sent") {
    return { iconId: "singleTick", isRead: false, isFailed: false };
  }

  return { iconId: "cross", isRead: false, isFailed: true };
}

function Message(props: Pick<Inbox, "lastMessage" | "lastMessageStatus" | "fromMe">) {
  const { lastMessage, lastMessageStatus, fromMe } = props;
  if (!lastMessage) return <></>;
  const statusVisual = getSidebarMessageVisual(fromMe, lastMessageStatus);

  return (
    <>
      {statusVisual.iconId && (
        <MessageStatusIcon
          isRead={statusVisual.isRead}
          isFailed={statusVisual.isFailed}
          id={statusVisual.iconId}
        />
      )}
      <Subtitle>{lastMessage}</Subtitle>
    </>
  );
}

type TrailingProps = Pick<Inbox, "participantId" | "waId" | "isPinned" | "notificationsCount"> & {
  onTogglePin?: (participantId: string, next: boolean, waId?: string) => void;
  showChevron?: boolean;
};

function Trailing(props: TrailingProps) {
  const { participantId, waId, isPinned, notificationsCount, onTogglePin, showChevron } = props;

  // robust boolean coercion (handles 0/1, "0"/"1", true/false, "true"/"false")
  const pinned =
    typeof isPinned === "boolean"
      ? isPinned
      : isPinned === 1 || isPinned === "1" || isPinned === "true";

  const chevronVisible = !!showChevron;

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(participantId, !pinned, waId); // use the coerced boolean
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
