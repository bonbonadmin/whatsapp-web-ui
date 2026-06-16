import { useRef, useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
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
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";

interface WhatsappComponent {
  text: string;
  type: string;
  buttons?: any[];
  example?: Record<string, any>;
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
}
interface WhatsappTemplate {
  id: number;
  template_name: string;
  all_component: WhatsappComponent[];
  lang_code: string;
}
interface PresetMessage {
  id: number;
  message: string;
}

const attachButtons = [
  { icon: "attachDocument", label: "Choose document", type: "doc" },
  { icon: "attachImage", label: "Choose image", type: "img" },
  { icon: "attachTemplate", label: "Templates", type: "templates" },
  { icon: "manualWebhook", label: "Manual Webhook", type: "webhook" },
  { icon: "manualAI", label: "Manual AI", type: "ai" },
  { icon: "attachPreset", label: "Preset Messages", type: "preset" },
];

const modalStyle = {
  position: "absolute" as const,
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
  const [headerMediaUrl, setHeaderMediaUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [varInputs, setVarInputs] = useState<Record<string, string>>({});
  const [buttonInputs, setButtonInputs] = useState<{
    thumbnail_product_retailer_id: string;
    title: string;
    product_items: string;
  }>({ thumbnail_product_retailer_id: "", title: "", product_items: "" });
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState("");
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRole, setAiRole] = useState<"user" | "assistant" | "developer">("user");
  const [aiMessage, setAiMessage] = useState("");
  const [aiMode, setAiMode] = useState<"message" | "trigger">("message");
  const [toolName, setToolName] = useState<"" | "send_rsvp" | "get_rsvp_rule">("");
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetMessages, setPresetMessages] = useState<PresetMessage[]>([]);

  const hiddenUploadImage = React.useRef<HTMLInputElement>(null);
  const hiddenUploadDoc = React.useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const chatCtx = useChatContext();
  const baseUrl = process.env.REACT_APP_API_URL ?? "";
  const location = useLocation();

  // ===== waId handling (URL ?waId= takes precedence, fallback to localStorage) =====
  const selectedWaId = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const q = qs.get("waId");
    if (q && q.trim()) return q.trim();
    return localStorage.getItem("wa:selectedId") || "";
  }, [location.search]);

  // Type-safe headers object
  const waHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {};
    if (selectedWaId) h["x-wa-id"] = selectedWaId;
    return h;
  }, [selectedWaId]);
  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) =>
        template.template_name.toLowerCase().includes(templateSearch.trim().toLowerCase())
      ),
    [templates, templateSearch]
  );

  // fetch templates when modal opens
  useEffect(() => {
    if (showTemplateModal) {
      fetch(`${baseUrl}/template`, { headers: waHeaders })
        .then((res) => res.json())
        .then((json) => setTemplates(json.data || []))
        .catch(console.error);
    }
  }, [showTemplateModal, baseUrl, waHeaders]);

  // fetch preset messages when modal opens
  useEffect(() => {
    if (showPresetModal) {
      fetch(`${baseUrl}/preset-message`, { headers: waHeaders })
        .then((res) => res.json())
        .then((json) => setPresetMessages(json.data || []))
        .catch(console.error);
    }
  }, [showPresetModal, baseUrl, waHeaders]);

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

  const handleSelectTemplate = (template: WhatsappTemplate) => {
    setSelectedTemplate(template);
    const headerComp = template.all_component?.find((c) => c.type === "HEADER");
    const headerFmt = (headerComp?.format || "").toUpperCase(); // "IMAGE" | "VIDEO" | ...

    const exampleHeaderUrl =
      headerComp?.example?.header_handle?.[0] ??
      headerComp?.example?.header_handler?.[0] ??
      "";

    // Prepopulate URL only if header is IMAGE or VIDEO; otherwise clear it
    if (headerFmt === "IMAGE" || headerFmt === "VIDEO") {
      setHeaderMediaUrl(exampleHeaderUrl);
    } else {
      setHeaderMediaUrl("");
    }
    const comps: WhatsappComponent[] = template.all_component ?? [];

    const indices = comps
      .filter((c) => c.type === "BODY")
      .flatMap((c) =>
        Array.from(c.text.matchAll(/\{\{(\d+)\}\}/g) as IterableIterator<RegExpMatchArray>).map(
          (m) => m[1]
        )
      );

    const unique = Array.from(new Set(indices));
    const initInputs: Record<string, string> = {};
    unique.forEach((idx) => {
      initInputs[idx] = "";
    });
    setVarInputs(initInputs);

    const btnGroup = comps.find(
      (c) => c.type === "BUTTONS" && c.buttons?.some((b) => b.type.toLowerCase() === "mpm")
    );
    if (btnGroup) {
      setButtonInputs({ thumbnail_product_retailer_id: "", title: "", product_items: "" });
    }

    const urlGroup = comps.find((c) => c.type === "BUTTONS")?.buttons?.find((b) => b.type.toLowerCase() === "url");
    if (urlGroup?.url) {
      const vars = Array.from(
        (urlGroup.url.matchAll(/\{\{(\d+)\}\}/g) as IterableIterator<RegExpMatchArray>),
        (m) => m[1]
      );
      setUrlInputs(Object.fromEntries(Array.from(new Set(vars)).map((i) => [i, ""])));
    } else {
      setUrlInputs({});
    }
  };

  const handleSendTemplate = () => {
    if (!selectedTemplate) return;

    const comps: WhatsappComponent[] = selectedTemplate.all_component ?? [];

    // BODY
    const params = Object.entries(varInputs).map(([_, v]) => ({ type: "text" as const, text: v }));
    const payload: any[] = [];
    const headerComp = comps.find((c) => c.type === "HEADER");
    const headerFmt = (headerComp?.format || "").toUpperCase(); // "IMAGE" | "VIDEO" | "TEXT" | ...

    if ((headerFmt === "IMAGE" || headerFmt === "VIDEO") && headerMediaUrl.trim()) {
      // WhatsApp Cloud API template component for media header:
      // { type: "header", parameters: [{ type: "image"|"video", image|video: { link: "https://..." } }] }
      const mediaKey = headerFmt === "IMAGE" ? "image" : "video";
      payload.push({
        type: "header",
        parameters: [
          {
            type: mediaKey,
            [mediaKey]: { link: headerMediaUrl.trim() },
          },
        ],
      });
    }
    if (params.length) payload.push({ type: "body" as const, parameters: params });

    // BUTTONS
    const btns = comps.find((c) => c.type === "BUTTONS")?.buttons || [];
    btns.forEach((b: any, i: number) => {
      const subtype = b.type.toLowerCase();
      if (subtype === "mpm") {
        const items = buttonInputs.product_items.split(",").map((c) => ({ product_retailer_id: c.trim() }));
        payload.push({
          type: "button" as const,
          sub_type: "mpm",
          index: i,
          parameters: [
            {
              type: "action" as const,
              action: {
                thumbnail_product_retailer_id: buttonInputs.thumbnail_product_retailer_id,
                sections: [{ title: buttonInputs.title, product_items: items }],
              },
            },
          ],
        });
      } else if (subtype === "url") {
        const urlParams = Object.entries(urlInputs).map(([_, v]) => ({ type: "text" as const, text: v }));
        payload.push({
          type: "button" as const,
          sub_type: "url",
          index: i,
          ...(urlParams.length ? { parameters: urlParams } : {}),
        });
      } else if (subtype === "catalog" || subtype === "flow") {
        payload.push({ type: "button" as const, sub_type: subtype, index: i });
      }
    });

    fetch(`${baseUrl}/templateMessage/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...waHeaders },
      body: JSON.stringify({
        to: chatCtx.activeChat?.participantId,
        type: "template" as const,
        templateName: selectedTemplate.template_name,
        languageCode: selectedTemplate.lang_code,
        components: payload,
      }),
    })
      .then(() => {
        setShowTemplateModal(false);
        setSelectedTemplate(null);
        setTemplateSearch("");
        setVarInputs({});
        setButtonInputs({ thumbnail_product_retailer_id: "", title: "", product_items: "" });
        setUrlInputs({});
      })
      .catch(console.error);
  };

  const sendWebhook = () => {
    if (!chatCtx.activeChat) return;
    fetch(`${baseUrl}/message/manual-webhook-v2`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...waHeaders },
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

    let textMessage: string;
    let messageRole: "user" | "assistant" | "developer" = "user";

    if (aiMode === "trigger") {
      if (!toolName) return; // or show toast
      textMessage = `<<RUN_TOOL: ${toolName}>>`; // name only
    } else {
      textMessage = aiMessage;
      messageRole = aiRole;
    }

    fetch(`${baseUrl}/message/add-thread-message-v2`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...waHeaders },
      body: JSON.stringify({
        phoneNumber: chatCtx.activeChat.participantId,
        textMessage,
        messageRole,
      }),
    })
      .then(() => {
        setShowAIModal(false);
        setAiMessage("");
        setAiRole("user");
        setAiMode("message");
        setToolName("");
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
          onChange={(e) => setNonManual(e.target.checked)}
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
            onChange={(e) => setWebhookMessage(e.target.value)}
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
          setAiRole("user");
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

          {/* Mode */}
          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend" sx={{ color: "#ccc" }}>Mode</FormLabel>
            <RadioGroup
              row
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value as "message" | "trigger")}
              sx={{ flexWrap: "wrap", rowGap: 1 }}
            >
              <FormControlLabel value="message" control={<Radio />} label="Message" sx={{ color: "#fff" }} />
              <FormControlLabel value="trigger" control={<Radio />} label="Trigger tool" sx={{ color: "#fff" }} />
            </RadioGroup>
          </FormControl>

          {/* Message mode */}
          {aiMode === "message" && (
            <>
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend" sx={{ color: "#ccc" }}>Post as</FormLabel>
                <RadioGroup
                  row
                  value={aiRole}
                  onChange={(e) => setAiRole(e.target.value as "user" | "assistant" | "developer")}
                  sx={{ flexWrap: "wrap", rowGap: 1 }}
                >
                  <FormControlLabel value="user" control={<Radio />} label="User" sx={{ color: "#fff" }} />
                  <FormControlLabel value="assistant" control={<Radio />} label="Assistant" sx={{ color: "#fff" }} />
                  <FormControlLabel value="developer" control={<Radio />} label="Developer" sx={{ color: "#fff" }} />
                </RadioGroup>
              </FormControl>

              <TextArea
                value={aiMessage}
                placeholder="Type your AI prompt here…"
                onChange={(e) => setAiMessage(e.target.value)}
                style={{ minHeight: "120px", color: "#fff" }}
              />
            </>
          )}

          {/* Trigger mode */}
          {aiMode === "trigger" && (
            <>
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend" sx={{ color: "#ccc" }}>Function</FormLabel>
                <RadioGroup
                  row
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value as "send_rsvp" | "get_rsvp_rule" | "")}
                  sx={{ flexWrap: "wrap", rowGap: 1 }}
                >
                  <FormControlLabel value="send_rsvp" control={<Radio />} label="send_rsvp" sx={{ color: "#fff" }} />
                  <FormControlLabel value="get_rsvp_rule" control={<Radio />} label="get_rsvp_rule" sx={{ color: "#fff" }} />
                </RadioGroup>
              </FormControl>

              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Will send <code>{`<<RUN_TOOL: ${toolName || "..." }>>`}</code> to the Assistant.
              </Typography>
            </>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <SendMessageButton
              onClick={sendAI}
              disabled={aiMode === "message" ? !aiMessage.trim() : !toolName}
            >
              <Icon id="send" />
            </SendMessageButton>
          </Box>
        </Box>
      </Modal>

      {/* Templates Modal */}
      <Modal
        open={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setSelectedTemplate(null);
          setTemplateSearch("");
          setVarInputs({});
          setButtonInputs({ thumbnail_product_retailer_id: "", title: "", product_items: "" });
          setUrlInputs({});
          setHeaderMediaUrl(""); // reset media URL
        }}
      >
        <Box
          sx={{
            ...modalStyle,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 24px)",
            width: "min(700px, calc(100vw - 24px))",
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
                  placeholder="Search template name"
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
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                <Grid container spacing={2} sx={{ fontWeight: "bold", mb: 1 }}>
                  <Grid item xs={4} sx={{ color: "#fff" }}>
                    Name
                  </Grid>
                  <Grid item xs={8} sx={{ color: "#fff" }}>
                    Text
                  </Grid>
                </Grid>
                {filteredTemplates.map((t) => {
                  const txt = t.all_component?.find((c) => c.type === "BODY")?.text || "";
                  return (
                    <Grid
                      container
                      spacing={2}
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      sx={{ cursor: "pointer", py: 1, "&:hover": { backgroundColor: "action.hover" } }}
                    >
                      <Grid item xs={4} sx={{ color: "#fff" }}>
                        {t.template_name}
                      </Grid>
                      <Grid item xs={8} sx={{ whiteSpace: "pre-wrap", typography: "body2", color: "#fff" }}>
                        {txt}
                      </Grid>
                    </Grid>
                  );
                })}
                {templates.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 2, color: "#fff" }}>No templates available.</Box>
                )}
                {templates.length > 0 && filteredTemplates.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 2, color: "#fff" }}>No templates match your search.</Box>
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Box
                  component="button"
                  type="button"
                  aria-label="Back to templates"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setVarInputs({});
                    setButtonInputs({ thumbnail_product_retailer_id: "", title: "", product_items: "" });
                    setUrlInputs({});
                    setHeaderMediaUrl("");
                  }}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    p: 0,
                    border: 0,
                    borderRadius: "50%",
                    color: "#fff",
                    background: "transparent",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "action.hover" },
                    "& .icon": {
                      width: 24,
                      height: 24,
                    },
                  }}
                >
                  <Icon id="back" className="icon" />
                </Box>
                <Typography variant="h6">Fill Template Variables</Typography>
              </Box>

              {/* Body preview */}
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 2, opacity: 0.8 }}>
                {selectedTemplate.all_component?.find((c: any) => c.type === "BODY")?.text || ""}
              </Typography>

              {/* Media Header URL (only for IMAGE/VIDEO) */}
              {(() => {
                const headerComp = selectedTemplate.all_component?.find((c: any) => c.type === "HEADER");
                const fmt = (headerComp?.format || "").toUpperCase();
                if (fmt !== "IMAGE" && fmt !== "VIDEO") return null;

                // Example from either key: header_handle or header_handler
                const exampleUrl =
                  headerComp?.example?.header_handle?.[0] ??
                  headerComp?.example?.header_handler?.[0] ??
                  "";

                // If user hasn't typed anything yet but example exists, show it as value
                const value = headerMediaUrl || exampleUrl;

                return (
                  <Box sx={{ mt: 1 }}>
                    <Typography sx={{ color: "#fff", mb: 1 }}>
                      {fmt === "IMAGE" ? "Header Image URL" : "Header Video URL"}
                    </Typography>
                    <Input
                      placeholder={fmt === "IMAGE" ? "https://…(image link)" : "https://…(video link)"}
                      value={value}
                      onChange={(e) => setHeaderMediaUrl(e.target.value)}
                      style={{ background: "transparent", color: "#fff" }}
                    />
                    {exampleUrl && (
                      <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.7 }}>
                        Example detected: {exampleUrl}
                      </Typography>
                    )}
                  </Box>
                );
              })()}

              {/* Variables for BODY {{n}} */}
              <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                {Object.entries(varInputs).map(([i, v]) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                      gap: 2,
                    }}
                  >
                    <Typography sx={{ width: { xs: "auto", sm: 120 }, color: "#fff" }}>{`{{${i}}}`}</Typography>
                    <Input
                      placeholder="Enter value"
                      value={v}
                      onChange={(e) => setVarInputs((old) => ({ ...old, [i]: e.target.value }))}
                      style={{ background: "transparent", color: "#fff" }}
                    />
                  </Box>
                ))}

                {/* MPM button params */}
                {selectedTemplate.all_component
                  ?.find((c: any) => c.type === "BUTTONS")
                  ?.buttons?.some((b: any) => b.type.toLowerCase() === "mpm") && (
                    <>
                      <Typography sx={{ color: "#fff", mt: 2 }}>MPM Button Action Parameters</Typography>
                      <Input
                        placeholder="Thumbnail Product Retailer ID"
                        value={buttonInputs.thumbnail_product_retailer_id}
                        onChange={(e) =>
                          setButtonInputs((b) => ({ ...b, thumbnail_product_retailer_id: e.target.value }))
                        }
                        style={{ background: "transparent", color: "#fff" }}
                      />
                      <Input
                        placeholder="Section Title"
                        value={buttonInputs.title}
                        onChange={(e) => setButtonInputs((b) => ({ ...b, title: e.target.value }))}
                        style={{ background: "transparent", color: "#fff" }}
                      />
                      <Input
                        placeholder="Product Items (comma-separated)"
                        value={buttonInputs.product_items}
                        onChange={(e) => setButtonInputs((b) => ({ ...b, product_items: e.target.value }))}
                        style={{ background: "transparent", color: "#fff" }}
                      />
                    </>
                  )}

                {/* URL button params */}
                {selectedTemplate.all_component
                  ?.find((c: any) => c.type === "BUTTONS")
                  ?.buttons?.some((b: any) => b.type.toLowerCase() === "url") && (
                    <>
                      <Typography sx={{ color: "#fff", mt: 2 }}>URL Button Parameters</Typography>
                      {Object.entries(urlInputs).map(([i, v]) => (
                        <Box
                          key={i}
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: { xs: "stretch", sm: "center" },
                            gap: 2,
                          }}
                        >
                          <Typography sx={{ width: { xs: "auto", sm: 120 }, color: "#fff" }}>{`{{${i}}}`}</Typography>
                          <Input
                            placeholder="Enter value"
                            value={v}
                            onChange={(e) => setUrlInputs((old) => ({ ...old, [i]: e.target.value }))}
                            style={{ background: "transparent", color: "#fff" }}
                          />
                        </Box>
                      ))}
                    </>
                  )}
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
              const preview = pm.message.slice(0, 50) + (pm.message.length > 50 ? "…" : "");
              return (
                <Box
                  key={pm.id}
                  onClick={() => {
                    setMessageValue(pm.message);
                    setShowPresetModal(false);
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

      <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
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
