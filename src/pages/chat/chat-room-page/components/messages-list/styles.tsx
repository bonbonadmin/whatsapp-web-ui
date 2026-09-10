import styled, { css } from "styled-components";

export const Container = styled.div`
  flex: 1;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem 5% 2rem;

  .icon {
    color: ${(props) => props.theme.common.subHeadingColor};
    margin-right: 0.3rem;
    margin-bottom: -1px;
  }
`;

export const wrapperStyles = css`
  z-index: 9;
`;

export const DateWrapper = styled.div`
  text-align: center;
  margin: 10px 0 14px;
  position: relative;

  ${wrapperStyles}
`;

export const Date = styled.span`
  background: ${(props) => props.theme.badge.bgColor};
  display: inline-block;
  color: ${(props) => props.theme.badge.textColor};
  font-size: 0.75rem;
  padding: 7px 10px;
  border-radius: 5px;
`;

export const EncryptionMessage = styled.p`
  background: ${(props) => props.theme.encryptionMessage.bgColor};
  color: ${(props) => props.theme.encryptionMessage.textColor};
  font-size: 0.77rem;
  text-align: center;
  padding: 5px 10px;
  position: relative;
  margin-bottom: 8px;
  border-radius: 5px;
  line-height: 20px;

  ${wrapperStyles}
`;

export const MessageGroup = styled.div`
  ${wrapperStyles}

  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
  position: relative;

  .chat__msg--sent {
    background: ${(props) => props.theme.sentMessage.bgColor};
    align-self: flex-end;
  }

  .chat__msg--received {
    background: ${(props) => props.theme.receivedMessage.bgColor};
    align-self: flex-start;
  }

  & > *:nth-child(1):not(.chat__msg--sent)::before,
  .chat__msg--sent + .chat__msg--received::before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    top: 0;
    left: -8px;
    border-top: 6px solid ${(props) => props.theme.receivedMessage.bgColor};
    border-right: 6px solid ${(props) => props.theme.receivedMessage.bgColor};
    border-bottom: 6px solid transparent;
    border-left: 6px solid transparent;
  }

  & > *:nth-child(1):not(.chat__msg--received)::before,
  .chat__msg--received + .chat__msg--sent::before {
    right: -8px;
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    top: 0;
    border-top: 6px solid ${(props) => props.theme.sentMessage.bgColor};
    border-right: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid ${(props) => props.theme.sentMessage.bgColor};
  }

  .chat__msg-status-icon {
    color: ${(props) => props.theme.common.subHeadingColor};
    margin-left: 3px;
  }

  .chat__msg-status-icon--blue {
    color: ${(props) => props.theme.common.readIconColor};
  }
`;

export const ChatMessage = styled.div`
  padding: 6px 7px 8px 9px;
  margin-bottom: 12px;
  font-size: 0.85rem;
  color: ${(props) => props.theme.common.mainHeadingColor};
  width: fit-content;
  max-width: 95%;
  line-height: 20px;
  border-radius: 5px;
  position: relative;
  white-space: pre-line;
  display: block;
  word-break: break-word;

  @media screen and (min-width: 1301px) {
    max-width: 65%;
  }

  @media screen and (min-width: 1000px) and (max-width: 1300px) {
    max-width: 75%;
  }

  @media screen and (min-width: 768px) and (max-width: 999px) {
    max-width: 85%;
  }

  @media screen and (max-width: 767px) {
    max-width: 95%;
  }
`;

export const QuotedMessagePreview = styled.button`
  appearance: none;
  width: 100%;
  max-width: 360px;
  border: 0;
  border-left: 3px solid #25d366;
  background: rgba(255, 255, 255, 0.42);
  border-radius: 4px;
  color: ${(props) => props.theme.common.mainHeadingColor};
  cursor: default;
  display: block;
  font: inherit;
  margin: 0 0 6px;
  padding: 5px 8px 6px;
  text-align: left;
  white-space: normal;

  &:not(:disabled) {
    cursor: pointer;
  }

  &:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.62);
  }

  &:disabled {
    opacity: 1;
  }
`;

export const QuotedMessageAuthor = styled.span`
  color: #128c7e;
  display: block;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 16px;
`;

export const QuotedMessageText = styled.span`
  color: ${(props) => props.theme.common.subHeadingColor};
  display: block;
  font-size: 0.78rem;
  line-height: 17px;
  max-height: 36px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ReplyActionButton = styled.button`
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  color: ${(props) => props.theme.common.subHeadingColor};
  cursor: pointer;
  font-size: 0.68rem;
  font-weight: 600;
  opacity: 0;
  padding: 2px 6px;
  position: absolute;
  right: 6px;
  top: -10px;
  transition: opacity 0.15s ease, background 0.15s ease;

  ${ChatMessage}:hover &,
  ${ChatMessage}:focus-within & {
    opacity: 1;
  }

  &:hover,
  &:focus-visible {
    background: rgba(255, 255, 255, 0.82);
    opacity: 1;
    outline: none;
  }
`;

export const TemplateMessageTooltip = styled.div`
  background: #111b21;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  color: #f0f2f5;
  display: block;
  font-size: 0.78rem;
  line-height: 1.45;
  max-width: calc(100vw - 32px);
  overflow: auto;
  padding: 10px 12px;
  pointer-events: none;
  position: fixed;
  white-space: pre-wrap;
  z-index: 2000;
`;

export const ChatMessageFiller = styled.span`
  width: 65px;
  display: inline-block;
  height: 3px;
  background: transparent;
`;

export const ChatMessageFooter = styled.span`
  position: absolute;
  display: flex;
  align-items: center;
  right: 7px;
  bottom: 3px;
  color: ${(props) => props.theme.common.subHeadingColor};
  font-size: 0.7rem;
  font-weight: 500;
`;
