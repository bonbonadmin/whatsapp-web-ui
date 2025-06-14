import { forwardRef, useEffect, useMemo, useState } from "react";
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
  shouldScrollToBottom?: boolean;
  testToBottom?: boolean;
};

export default function MessagesList(props: MessagesListProps) {
  const { onShowBottomIcon, shouldScrollToBottom, testToBottom } = props;
  console.log('test to bottom', testToBottom);
  const chatCtx = useChatContext();

  const params = useParams();

  const { containerRef, lastMessageRef } = useScrollToBottom(
    onShowBottomIcon,
    shouldScrollToBottom,
    params.id,
    testToBottom
  );
  // console.log(lastMessageRef);

  return (
    <Container ref={containerRef}>
      <EncryptionMessage>
        <Icon id="lock" className="icon" />
        Messages are end-to-end encrypted. No one outside of this chat, not even Message, can read
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
              ref={isLastMessage ? lastMessageRef : null}
            />
          );
        })}
      </MessageGroup>
    </Container>
  );
}

const SingleMessage = forwardRef((props: { message: Message }, ref: any) => {
  const { message } = props;

  return (
    <ChatMessage
      key={message.id}
      className={message.isOpponent ? "chat__msg--received" : "chat__msg--sent"}
      ref={ref}
    >
      <span>{message.body}</span>
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
  );
});
