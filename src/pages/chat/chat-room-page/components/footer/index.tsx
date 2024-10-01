import { useState } from "react";
import Icon from "common/components/icons";
import {
  AttachButton,
  Button,
  ButtonsContainer,
  IconsWrapper,
  Input,
  SendMessageButton,
  Wrapper,
} from "./styles";
import { useChatContext } from "pages/chat/context/chat";
import { Message, MessageTextPayload } from "../messages-list/data/get-messages";

const attachButtons = [
  { icon: "attachRooms", label: "Choose room" },
  { icon: "attachContacts", label: "Choose contact" },
  { icon: "attachDocument", label: "Choose document" },
  { icon: "attachCamera", label: "Use camera" },
  { icon: "attachImage", label: "Choose image" },
];

export default function Footer() {
  const [showIcons, setShowIcons] = useState(false);
  const [messageValue, setMessageValue] = useState('');

  const chatCtx = useChatContext();

  const submitMessage = () => {
    const newMsg: MessageTextPayload = {
      to: chatCtx.activeChat?.participantId,
      textMessage: messageValue,
      mediaType: 'text',
    }
    chatCtx.onSendMessage(newMsg);
    setMessageValue('');
  };

  return (
    <Wrapper>
      <IconsWrapper>
        <AttachButton onClick={() => setShowIcons(!showIcons)}>
          <Icon id="attach" className="icon" />
        </AttachButton>
        <ButtonsContainer>
          {attachButtons.map((btn) => (
            <Button showIcon={showIcons} key={btn.label}>
              <Icon id={btn.icon} />
            </Button>
          ))}
        </ButtonsContainer>
      </IconsWrapper>
      <Input type="text" value={messageValue} name="message" onChange={e => setMessageValue(e.target.value)} placeholder="Type a message here .." />
      <SendMessageButton onClick={submitMessage}>
        <Icon id="send" className="icon" />
      </SendMessageButton>
    </Wrapper>
  );
}
