import { useRef, useState, useEffect } from "react";
import Icon from "common/components/icons";
import {
  AttachButton,
  Button,
  ButtonsContainer,
  IconsWrapper,
  Input,
  SendMessageButton,
  TextArea,
  Wrapper,
  ControlsWrapper,
} from "./styles";
import { useChatContext } from "pages/chat/context/chat";
import { Message, MessageTextPayload } from "../messages-list/data/get-messages";
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid"; // make sure to import

interface WhatsappComponent {
  text: string;
  type: string;
  example?: Record<string, any>;
}
interface WhatsappTemplate {
  id: number;
  template_name: string;
  all_component: WhatsappComponent[];
  lang_code: string;
}

const attachButtons = [
  // { icon: "attachRooms", label: "Choose room" },
  // { icon: "attachContacts", label: "Choose contact" },
  { icon: "attachDocument", label: "Choose document", type: "doc" },
  // { icon: "attachCamera", label: "Use camera" },
  { icon: "attachImage", label: "Choose image", type: "img" },
  { icon: "attachContacts", label: "Templates", type: "templates" },
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
  const [nonManual, setNonManual] = useState(false);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [varInputs, setVarInputs] = useState<Record<string, string>>({});

  const hiddenUploadImage = React.useRef<HTMLInputElement>(null);
  const hiddenUploadDoc = React.useRef<HTMLInputElement>(null);

  const chatCtx = useChatContext();
  const baseUrl = process.env.REACT_APP_API_URL;

  // fetch templates when modal opens
  useEffect(() => {
    if (showTemplateModal) {
      fetch(`${baseUrl}/template`)
        .then(res => res.json())
        .then(json => setTemplates(json.data || []))
        .catch(console.error);
    }
  }, [showTemplateModal, baseUrl]);

  const submitMessage = () => {
    if (open && fileUpload) {
      chatCtx.onUploadFile(fileUpload, messageValue, uploadType, nonManual);
      setMessageValue("");
      setFileUpload(undefined);
      setOpen(false);
    } else {
      const newMsg: MessageTextPayload = {
        to: chatCtx.activeChat?.participantId,
        textMessage: messageValue,
        mediaType: "text",
        nonManual,
      };
      chatCtx.onSendMessage(newMsg);
      setMessageValue("");
    }
  };

  const handleSelectTemplate = (template: WhatsappTemplate) => {
    // Store the selected template immediately
    setSelectedTemplate(template);

    // Always treat all_component as an array
    const comps: WhatsappComponent[] = template.all_component ?? [];

    // For each BODY component, pull out all {{n}} matches
    const indices = comps
      .filter(c => c.type === 'BODY')
      .flatMap(c => {
        // Force the iterator to a typed array
        const matches = Array.from(
          c.text.matchAll(/\{\{(\d+)\}\}/g) as IterableIterator<RegExpMatchArray>
        );
        // Map each RegExpMatchArray to its first capture group
        return matches.map(match => match[1]);
      });

    // Dedupe
    const unique = Array.from(new Set(indices));

    // Initialize an empty string for each variable index
    const initInputs: Record<string, string> = {};
    unique.forEach(idx => { initInputs[idx] = ""; });

    setVarInputs(initInputs);
  };

  const handleSendTemplate = () => {
    if (!selectedTemplate) return;
    const params = Object.keys(varInputs).map(key => ({ type: 'text', text: varInputs[key] }));
    const components = selectedTemplate.all_component
      .filter((c: any) => c.type === 'BODY')
      .map(() => ({ type: 'body', parameters: params }));

    fetch(`${baseUrl}/templateMessage/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: chatCtx.activeChat?.participantId,
        type: 'template',
        templateName: selectedTemplate.template_name,
        languageCode: selectedTemplate.lang_code,
        components,
      }),
    }).then(() => {
      setShowTemplateModal(false);
      setSelectedTemplate(null);
      setVarInputs({});
    }).catch(console.error);
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
      case "templates":
        setShowTemplateModal(true);
        break;

      default:
        break;
    }
  };

  const handleKeyDown = (event: any) => {
    if (event.keyCode === 13 && !event.shiftKey) {
      submitMessage(); //Submit your form here
      return false;
    }
    // if (event.key === "Enter") {
    //   // if (open && fileUpload) {
    //   //   chatCtx.onUploadFile(fileUpload, messageValue);
    //   //   setMessageValue("");
    //   //   setFileUpload(undefined);
    //   //   setOpen(false);
    //   // } else {
    //   //   submitMessage();
    //   // }
    //   submitMessage();
    // }
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
      <TextArea
        value={messageValue}
        name="message"
        onChange={(e) => setMessageValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message here .."
        style={{ fontSize: "0.90rem" }}
      />
      <ControlsWrapper>
        <Checkbox
          checked={nonManual}
          onChange={e => setNonManual(e.target.checked)}
          inputProps={{ "aria-label": "non manual" }}
        />
        <SendMessageButton onClick={submitMessage}>
          <Icon id="send" className="icon" />
        </SendMessageButton>
      </ControlsWrapper>

      {/* Templates Modal */}
      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        aria-labelledby="template-modal-title"
        aria-describedby="template-modal-description"
      >
        <Box
          sx={{
            ...modalStyle,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            maxHeight: "80vh",    // keep it from overflowing the screen
            width: 700,
          }}
        >
          {/* 1) Template List */}
          {!selectedTemplate ? (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select a Template
              </Typography>

              <Box sx={{ flex: 1, overflowY: "auto" }}>
                {/* optional header row */}
                <Grid container spacing={2} sx={{ fontWeight: "bold", mb: 1 }}>
                  <Grid item xs={4}>Name</Grid>
                  <Grid item xs={8}>Text</Grid>
                </Grid>

                {templates.map((t) => {
                  const bodyText =
                    t.all_component?.find((c: any) => c.type === "BODY")?.text || "";
                  return (
                    <Grid
                      container
                      spacing={2}
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      sx={{
                        cursor: "pointer",
                        py: 1,
                        "&:hover": { backgroundColor: "action.hover" },
                      }}
                    >
                      <Grid item xs={4} sx={{ color: "#fff" }}>
                        {t.template_name}
                      </Grid>
                      <Grid
                        item
                        xs={8}
                        sx={{ whiteSpace: "pre-wrap", typography: "body2", color: "#fff" }}
                      >
                        {bodyText}
                      </Grid>
                    </Grid>
                  );
                })}

                {templates.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 2, color: "#fff" }}>
                    No templates available.
                  </Box>
                )}
              </Box>
            </>
          ) : (
            /* 2) Variable-Fill UI */
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Fill Template Variables
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  mb: 2,
                  color: "#fff",
                  opacity: 0.8
                }}
              >
                {
                  // pull the first BODY component or blank
                  (selectedTemplate.all_component ?? [])
                    .find((c: any) => c.type === "BODY")
                    ?.text || ""
                }
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {Object.entries(varInputs).map(([idx, val]) => (
                  <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography sx={{ width: 120, color: "#fff" }}>
                      {'{{' + idx + '}}'}
                    </Typography>
                    <Input
                      placeholder="Enter value"
                      value={val}
                      onChange={(e) =>
                        setVarInputs((v) => ({ ...v, [idx]: e.target.value }))
                      }
                      style={{ background: "transparent", color: "#fff" }}
                    />
                  </Box>
                ))}
              </Box>

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <SendMessageButton onClick={handleSendTemplate}>
                  <Icon id="send" />
                </SendMessageButton>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>

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
