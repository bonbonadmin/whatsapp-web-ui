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
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";

const attachButtons = [
  // { icon: "attachRooms", label: "Choose room" },
  // { icon: "attachContacts", label: "Choose contact" },
  { icon: "attachDocument", label: "Choose document", type: "doc" },
  // { icon: "attachCamera", label: "Use camera" },
  { icon: "attachImage", label: "Choose image", type: "img" },
];

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "60%",
  transform: "translate(-50%, -50%)",
  width: 700,
  bgcolor: "#323739",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  borderRadius: "20px",
};

export default function Footer() {
  const [showIcons, setShowIcons] = useState(false);
  const [messageValue, setMessageValue] = useState("");
  const [fileUpload, setFileUpload] = useState<File>();
  const [open, setOpen] = useState(false);
  const [uploadType, setUploadType] = useState("image");

  const hiddenUploadImage = React.useRef<HTMLInputElement>(null);
  const hiddenUploadDoc = React.useRef<HTMLInputElement>(null);

  const chatCtx = useChatContext();

  const submitMessage = () => {
    if (open && fileUpload) {
      chatCtx.onUploadFile(fileUpload, messageValue, uploadType);
      setMessageValue("");
      setFileUpload(undefined);
      setOpen(false);
    } else {
      const newMsg: MessageTextPayload = {
        to: chatCtx.activeChat?.participantId,
        textMessage: messageValue,
        mediaType: "text",
      };
      chatCtx.onSendMessage(newMsg);
      setMessageValue("");
    }
  };

  const onSelectImage = (event: any) => {
    const selectedImage = event.target.files[0];
    if (selectedImage) {
      setFileUpload(selectedImage);
      handleOpen();
    }
    setShowIcons(false);
  };

  const handleClick = (type: string) => {
    switch (type) {
      case "img":
        setUploadType("image");
        hiddenUploadImage.current?.click();
        break;
      case "doc":
        setUploadType("document");
        hiddenUploadDoc.current?.click();
        break;

      default:
        break;
    }
  };

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      // if (open && fileUpload) {
      //   chatCtx.onUploadFile(fileUpload, messageValue);
      //   setMessageValue("");
      //   setFileUpload(undefined);
      //   setOpen(false);
      // } else {
      //   submitMessage();
      // }
      submitMessage();
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setMessageValue("");
    setFileUpload(undefined);
    setOpen(false);
  };

  return (
    <Wrapper>
      <IconsWrapper>
        <AttachButton onClick={() => setShowIcons(!showIcons)}>
          <Icon id="attach" className="icon" />
        </AttachButton>
        <ButtonsContainer>
          {attachButtons.map((btn) => (
            <Button
              showIcon={showIcons}
              key={btn.label}
              onClick={() => {
                handleClick(btn.type);
              }}
            >
              <Icon id={btn.icon}></Icon>
            </Button>
          ))}
          <Input
            type="file"
            accept="image/*"
            onChange={(event: any) => {
              onSelectImage(event);
            }}
            ref={hiddenUploadImage}
            style={{ display: "none" }}
          />
          <Input
            type="file"
            accept="application/msword, application/vnd.ms-excel, application/vnd.ms-powerpoint, text/plain, application/pdf"
            onChange={(event: any) => {
              onSelectImage(event);
            }}
            ref={hiddenUploadDoc}
            style={{ display: "none" }}
          />
        </ButtonsContainer>
      </IconsWrapper>
      <Input
        type="text"
        value={messageValue}
        name="message"
        onChange={(e) => setMessageValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message here .."
      />
      <SendMessageButton onClick={submitMessage}>
        <Icon id="send" className="icon" />
      </SendMessageButton>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Wrapper>
            <Input
              type="text"
              value={messageValue}
              name="message"
              onChange={(e) => setMessageValue(e.target.value)}
              placeholder="Type a message for the image here .."
            />
            <SendMessageButton onClick={submitMessage}>
              <Icon id="send" className="icon" />
            </SendMessageButton>
          </Wrapper>
        </Box>
      </Modal>
    </Wrapper>
  );
}
