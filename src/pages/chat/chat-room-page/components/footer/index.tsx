import { useRef, useState } from "react";
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
import React from "react";

const attachButtons = [
  // { icon: "attachRooms", label: "Choose room" },
  // { icon: "attachContacts", label: "Choose contact" },
  // { icon: "attachDocument", label: "Choose document" },
  // { icon: "attachCamera", label: "Use camera" },
  { icon: "attachImage", label: "Choose image" },
];

export default function Footer() {
  const [showIcons, setShowIcons] = useState(false);
  const [messageValue, setMessageValue] = useState("");

  const hiddenFileInput = React.useRef<HTMLInputElement>(null);

  const chatCtx = useChatContext();

  const submitMessage = () => {
    const newMsg: MessageTextPayload = {
      to: chatCtx.activeChat?.participantId,
      textMessage: messageValue,
      mediaType: "text",
    };
    chatCtx.onSendMessage(newMsg);
    setMessageValue("");
  };

  const onSelectImage = (event: any) => {
    const selectedImage = event.target.files[0];
    if (selectedImage) chatCtx.onUploadImage(selectedImage);
    setShowIcons(false);
  };

  const handleClick = event => {
    hiddenFileInput.current?.click();   
  };

  return (
    <Wrapper>
      <IconsWrapper>
        <AttachButton onClick={() => setShowIcons(!showIcons)}>
          <Icon id="attach" className="icon" />
        </AttachButton>
        <ButtonsContainer>
          {attachButtons.map((btn) => (
            <Button showIcon={showIcons} key={btn.label} onClick={handleClick}>
              <Icon id={btn.icon}></Icon>
            </Button>
          ))}
          <Input
            type="file"
            accept="image/*"
            onChange={(event: any) => {
              onSelectImage(event);
            }}
            ref={hiddenFileInput}
            style={{ display: "none" }}
          />
        </ButtonsContainer>
      </IconsWrapper>
      <Input
        type="text"
        value={messageValue}
        name="message"
        onChange={(e) => setMessageValue(e.target.value)}
        placeholder="Type a message here .."
      />
      <SendMessageButton onClick={submitMessage}>
        <Icon id="send" className="icon" />
      </SendMessageButton>
    </Wrapper>
  );
}
