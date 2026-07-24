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
  ReplyTargetBar,
  ReplyTargetText,
  ReplyTargetAuthor,
  ReplyTargetBody,
  ClearReplyButton,
} from "./styles";
import { useChatContext } from "pages/chat/context/chat";
import { MessageTextPayload } from "../messages-list/data/get-messages";
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";
import TemplateForm, { WhatsappTemplate } from "./template-form";

interface PresetMessage {
  id: number;
  message: string;
}

const attachButtons = [
  // { icon: "attachRooms", label: "Choose room" },
  // { icon: "attachContacts", label: "Choose contact" },
  { icon: "attachDocument", label: "Choose document", type: "doc" },
  // { icon: "attachCamera", label: "Use camera" },
  { icon: "attachImage", label: "Choose image", type: "img" },
  { icon: "attachTemplate", label: "Templates", type: "templates" },
  { icon: "manualWebhook", label: "Manual Webhook", type: "webhook" },
  { icon: "manualAI", label: "Manual AI", type: "ai" },
  { icon: "attachPreset", label: "Preset Messages", type: "preset" },
];

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(700px, calc(100vw - 24px))",
  maxWidth: "calc(100vw - 24px)",
  maxHeight: "calc(100vh - 24px)",
  bgcolor: "#323739",
  border: "2px solid #000",
  boxShadow: 24,
  p: { xs: 2, sm: 3, md: 4 },
  borderRadius: { xs: "16px", sm: "20px" },
  overflowY: "auto",
  boxSizing: "border-box",
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
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsappTemplate | null>(null);
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState("");
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRole, setAiRole] = useState<"user" | "assistant" | "developer">("user");
  const [aiMessage, setAiMessage] = useState("");
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetMessages, setPresetMessages] = useState<PresetMessage[]>([]);

  const hiddenUploadImage = React.useRef<HTMLInputElement>(null);
  const hiddenUploadDoc = React.useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const chatCtx = useChatContext();
  const baseUrl = process.env.REACT_APP_API_URL;
  const templateQuery = templateSearch.trim().toLowerCase();
  const filteredTemplates = templates.filter((template) => {
    if (!templateQuery) return true;
    const body = template.all_component?.find((c) => c.type === "BODY")?.text || "";
    return (
      template.template_name.toLowerCase().includes(templateQuery) ||
      body.toLowerCase().includes(templateQuery)
    );
  });

  // fetch templates when modal opens
  useEffect(() => {
    if (showTemplateModal) {
      fetch(`${baseUrl}/template`)
        .then(res => res.json())
        .then(json => setTemplates(json.data || []))
        .catch(console.error);
    }
  }, [showTemplateModal, baseUrl]);

  useEffect(() => {
    if (showPresetModal) {
      fetch(`${baseUrl}/preset-message`)
        .then((res) => res.json())
        .then((json) => setPresetMessages(json.data || []))
        .catch(console.error);
    }
  }, [showPresetModal, baseUrl]);

  const submitMessage = () => {
    const contextMessageId = chatCtx.replyTarget?.messageId ?? null;
    if (open && fileUpload) {
      chatCtx.onUploadFile(fileUpload, messageValue, uploadType, nonManual, contextMessageId);
      setMessageValue("");
      setFileUpload(undefined);
      setOpen(false);
      messageInputRef.current?.focus();
    } else {
      const newMsg: MessageTextPayload = {
        to: chatCtx.activeChat?.participantId,
        textMessage: messageValue,
        mediaType: "text",
        nonManual,
        contextMessageId,
      };
      chatCtx.onSendMessage(newMsg);
      setMessageValue("");
      messageInputRef.current?.focus();
    }
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    setSelectedTemplate(null);
    setTemplateSearch("");
    setTemplateError("");
    setSendingTemplate(false);
  };

  const handleSendTemplate = (components: any[]) => {
    if (!selectedTemplate || sendingTemplate) return;

    setSendingTemplate(true);
    setTemplateError("");

    fetch(`${baseUrl}/templateMessage/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: chatCtx.activeChat?.participantId,
        type: "template" as const,
        templateName: selectedTemplate.template_name,
        languageCode: selectedTemplate.lang_code,
        components,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        closeTemplateModal();
      })
      .catch((error) => {
        console.error(error);
        setTemplateError("Couldn't send the template. Please try again.");
      })
      .finally(() => setSendingTemplate(false));
  };

  const sendWebhook = () => {
    if (!chatCtx.activeChat) return;
    fetch(`${baseUrl}/message/manual-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: chatCtx.activeChat.participantId,
        textMessage: webhookMessage,
      }),
    })
      .then(() => {
        setShowWebhookModal(false);
        setWebhookMessage("");
      })
      .catch(console.error);
  };

  const sendAI = () => {
    if (!chatCtx.activeChat) return;
    fetch(`${baseUrl}/message/add-thread-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: chatCtx.activeChat.participantId,
        textMessage: aiMessage,
        messageRole: aiRole, // !!
      }),
    })
      .then(() => {
        setShowAIModal(false);
        setAiMessage("");
        setAiRole("user"); // !!
      })
      .catch(console.error);
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
      case "webhook":
        setShowWebhookModal(true);
        break;
      case "ai":
        setShowAIModal(true);
        break;
      case "preset":
        setShowPresetModal(true);
        break;
      default:
        break;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
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
    <>
      {chatCtx.replyTarget && (
        <ReplyTargetBar>
          <ReplyTargetText>
            <ReplyTargetAuthor>
              {chatCtx.replyTarget.isOpponent ? chatCtx.activeChat?.name || "Customer" : "You"}
            </ReplyTargetAuthor>
            <ReplyTargetBody>{getReplyPreviewText(chatCtx.replyTarget)}</ReplyTargetBody>
          </ReplyTargetText>
          <ClearReplyButton
            type="button"
            aria-label="Cancel reply"
            title="Cancel reply"
            onClick={chatCtx.onClearReplyTarget}
          >
            x
          </ClearReplyButton>
        </ReplyTargetBar>
      )}
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
        ref={messageInputRef}
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
      </Wrapper>

      {/* Manual Webhook Modal */}
      <Modal
        open={showWebhookModal}
        onClose={() => {
          setShowWebhookModal(false);
          setWebhookMessage("");
        }}
      >
        <Box
          sx={{
            ...modalStyle,
            width: "min(500px, calc(100vw - 24px))",
            bgcolor: "#323739",
            color: "#fff",
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h6">Manual Webhook</Typography>
          <TextArea
            value={webhookMessage}
            placeholder="Type your webhook payload here…"
            onChange={e => setWebhookMessage(e.target.value)}
            style={{ minHeight: "120px", color: "#fff" }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <SendMessageButton onClick={sendWebhook}>
              <Icon id="send" />
            </SendMessageButton>
          </Box>
        </Box>
      </Modal>

      {/* Manual AI Modal */}
      <Modal
        open={showAIModal}
        onClose={() => {
          setShowAIModal(false);
          setAiMessage("");
          setAiRole("user"); // !!
        }}
      >
        <Box
          sx={{
            ...modalStyle,
            width: "min(500px, calc(100vw - 24px))",
            bgcolor: "#323739",
            color: "#fff",
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h6">Manual AI</Typography>

          {/* !! Role selector */}
          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend" sx={{ color: "#ccc" }}>
              Post as
            </FormLabel>
            <RadioGroup
              row
              value={aiRole}
              onChange={(e) => setAiRole(e.target.value as "user" | "assistant" | "developer")}
              sx={{ flexWrap: "wrap", rowGap: 1 }}
            >
              <FormControlLabel
                value="user"
                control={<Radio />}
                label="User"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="assistant"
                control={<Radio />}
                label="Assistant"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="developer"
                control={<Radio />}
                label="Developer"
                sx={{ color: "#fff" }}
              />
            </RadioGroup>
          </FormControl>

          <TextArea
            value={aiMessage}
            placeholder="Type your AI prompt here…"
            onChange={(e) => setAiMessage(e.target.value)}
            style={{ minHeight: "120px", color: "#fff" }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <SendMessageButton onClick={sendAI} disabled={!aiMessage.trim()}>
              <Icon id="send" />
            </SendMessageButton>
          </Box>
        </Box>
      </Modal>

      {/* Templates Modal */}
      <Modal open={showTemplateModal} onClose={closeTemplateModal}>
        <Box
          sx={{
            ...modalStyle,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            height: "auto",
            maxHeight: selectedTemplate
              ? { xs: "calc(100vh - 24px)", md: "min(760px, calc(100vh - 24px))" }
              : "calc(100vh - 24px)",
            overflow: "hidden",
            width: selectedTemplate
              ? "min(1040px, calc(100vw - 24px))"
              : "min(700px, calc(100vw - 24px))",
          }}
        >
          {!selectedTemplate ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  mb: 2,
                }}
              >
                <Typography variant="h6">Select a Template</Typography>
                <TextField
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                  placeholder="Search name or message text"
                  size="small"
                  variant="outlined"
                  sx={{
                    width: { xs: "100%", sm: 260 },
                    "& .MuiOutlinedInput-root": {
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.24)" },
                      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                      "&.Mui-focused fieldset": { borderColor: "#fff" },
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "rgba(255,255,255,0.72)",
                      opacity: 1,
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
                {filteredTemplates.map((t) => {
                  const body = t.all_component?.find((c) => c.type === "BODY")?.text || "";
                  const header = t.all_component?.find((c) => c.type === "HEADER");
                  const headerFormat = (header?.format || (header?.text ? "TEXT" : "")).toUpperCase();
                  const tags = [t.lang_code, headerFormat].filter(Boolean);
                  return (
                    <Box
                      key={t.id}
                      component="button"
                      type="button"
                      onClick={() => {
                        setTemplateError("");
                        setSelectedTemplate(t);
                      }}
                      sx={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        color: "#fff",
                        cursor: "pointer",
                        display: "block",
                        p: 1.5,
                        textAlign: "left",
                        width: "100%",
                        "&:hover": {
                          background: "rgba(255,255,255,0.09)",
                          borderColor: "rgba(0,168,132,0.6)",
                        },
                      }}
                    >
                      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
                        <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                          {t.template_name}
                        </Typography>
                        {tags.map((tag) => (
                          <Box
                            key={tag}
                            sx={{
                              backgroundColor: "rgba(255,255,255,0.1)",
                              borderRadius: "4px",
                              color: "rgba(255,255,255,0.7)",
                              fontSize: "0.65rem",
                              letterSpacing: "0.04em",
                              px: 0.75,
                              py: "2px",
                              textTransform: "uppercase",
                            }}
                          >
                            {tag}
                          </Box>
                        ))}
                      </Box>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.65)",
                          display: "-webkit-box",
                          fontSize: "0.8rem",
                          mt: 0.5,
                          overflow: "hidden",
                          whiteSpace: "pre-wrap",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                        }}
                      >
                        {body}
                      </Typography>
                    </Box>
                  );
                })}
                {templates.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 2, color: "rgba(255,255,255,0.7)" }}>
                    No templates available.
                  </Box>
                )}
                {templates.length > 0 && filteredTemplates.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 2, color: "rgba(255,255,255,0.7)" }}>
                    No templates match your search.
                  </Box>
                )}
              </Box>
            </>
          ) : (
            <TemplateForm
              key={selectedTemplate.id}
              template={selectedTemplate}
              sending={sendingTemplate}
              errorMessage={templateError}
              onBack={() => {
                setSelectedTemplate(null);
                setTemplateError("");
              }}
              onSend={handleSendTemplate}
            />
          )}
        </Box>
      </Modal>

      {/* Preset Messages Modal */}
      <Modal
        open={showPresetModal}
        onClose={() => {
          setShowPresetModal(false);
        }}
      >
        <Box
          sx={{
            ...modalStyle,
            width: "min(600px, calc(100vw - 24px))",
            color: "#fff",
            p: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: "calc(100vh - 24px)",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Preset Messages
          </Typography>

          {presetMessages.length === 0 ? (
            <Box sx={{ opacity: 0.7, textAlign: "center", py: 2 }}>No preset messages.</Box>
          ) : (
            presetMessages.map((pm) => {
              const preview =
                pm.message.slice(0, 50) + (pm.message.length > 50 ? "…" : "");
              return (
                <Box
                  key={pm.id}
                  onClick={() => {
                    setMessageValue(pm.message); // Populate the text field
                    setShowPresetModal(false);   // Close so user can edit
                  }}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 1,
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "action.hover" },
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={pm.message}
                >
                  <Typography sx={{ color: "#fff" }}>{preview}</Typography>
                </Box>
              );
            })
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
    </>
  );
}

function getReplyPreviewText(message: { body?: string; messageType?: string }): string {
  const body = String(message.body || "")
    .replace(/\s*\.\s*Image url:\s*https?:\/\/\S+/gi, "")
    .replace(/\s*\.\s*Audio url:\s*https?:\/\/\S+/gi, "")
    .trim();

  if (body) return body;

  switch (message.messageType) {
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
