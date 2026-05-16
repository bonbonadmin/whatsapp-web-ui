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
import { MessageTextPayload } from "../messages-list/data/get-messages";
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid"; // make sure to import
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";

interface WhatsappComponent {
  text?: string;
  type: string;
  format?: string;
  buttons?: any[]; 
  example?: Record<string, any>;
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
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [varInputs, setVarInputs] = useState<Record<string, string>>({});
  const [buttonInputs, setButtonInputs] = useState<{
    thumbnail_product_retailer_id: string;
    title: string;
    product_items: string;
  }>({ thumbnail_product_retailer_id: "", title: "", product_items: "" });
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
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
  const filteredTemplates = templates.filter((template) =>
    template.template_name.toLowerCase().includes(templateSearch.trim().toLowerCase())
  );

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
    if (open && fileUpload) {
      chatCtx.onUploadFile(fileUpload, messageValue, uploadType, nonManual);
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
      };
      chatCtx.onSendMessage(newMsg);
      setMessageValue("");
      messageInputRef.current?.focus();
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
          (c.text ?? "").matchAll(/\{\{(\d+)\}\}/g) as IterableIterator<RegExpMatchArray>
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

    const imageHeader = comps.find(c => c.type === "HEADER" && c.format === "IMAGE");
    const headerHandle = imageHeader?.example?.header_handle;
    setHeaderImageUrl(Array.isArray(headerHandle) ? headerHandle[0] ?? "" : "");

    //MPM vars init
    const btnGroup = comps.find(c => c.type === 'BUTTONS' && c.buttons?.some(b => b.type.toLowerCase() === 'mpm')); //NEW
    if (btnGroup) {
      setButtonInputs({ thumbnail_product_retailer_id: '', title: '', product_items: '' }); //NEW
    }

    // URL vars init       
    const urlGroup = comps.find(c => c.type==="BUTTONS")
      ?.buttons?.find(b => b.type.toLowerCase()==="url");
    if (urlGroup?.url) {
      const vars = Array.from(
        (urlGroup.url.matchAll(/\{\{(\d+)\}\}/g) as IterableIterator<RegExpMatchArray>),
        m => m[1]
      );
      setUrlInputs(Object.fromEntries(Array.from(new Set(vars)).map(i=>[i,""])));
    } else {
      setUrlInputs({});  
    }
  };

  const handleSendTemplate = () => {
    if (!selectedTemplate) return;

    // Always treat all_component as an array
    const comps: WhatsappComponent[] = selectedTemplate.all_component ?? [];

    // 1) BODY
    const params = Object.entries(varInputs).map(([k,v]) => ({
      type:"text" as const, text:v
    }));
    const payload: any[] = [];
    const hasImageHeader = comps.some(c => c.type === "HEADER" && c.format === "IMAGE");
    if (hasImageHeader && headerImageUrl.trim()) {
      payload.push({
        type: "header" as const,
        parameters: [{
          type: "image" as const,
          image: { link: headerImageUrl.trim() }
        }]
      });
    }
    if (params.length) payload.push({ type:"body" as const, parameters:params });

    // 2) BUTTONS → MPM, catalog, flow, url
    const btns = comps.find(c => c.type === "BUTTONS")?.buttons || [];
    btns.forEach((b: any, i: number) => {
      const subtype = b.type.toLowerCase();
      // MPM(1) & URL(4) need parameters
      if (subtype === "mpm") {
        const items = buttonInputs.product_items
          .split(",").map(c => ({ product_retailer_id: c.trim() }));
        payload.push({
          type: "button" as const,
          sub_type: "mpm", index: i,
          parameters: [{
            type: "action" as const,
            action: {
              thumbnail_product_retailer_id: buttonInputs.thumbnail_product_retailer_id,
              sections: [{ title: buttonInputs.title, product_items: items }]
            }
          }]
        });
      } else if (subtype === "url") {
        // if urlInputs empty → no params
        const urlParams = Object.entries(urlInputs).map(([k, v]) => ({
          type: "text" as const, text: v
        }));  //NEW
        payload.push({
          type: "button" as const,
          sub_type: "url", index: i,
          ...(urlParams.length ? { parameters: urlParams } : {}),
        });
      } else if (subtype === "catalog" || subtype === "flow") {
        payload.push({ type: "button" as const, sub_type: subtype === "catalog" ? "CATALOG" : subtype, index: i });
      }
    });

    // send
    fetch(`${baseUrl}/templateMessage/send`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: chatCtx.activeChat?.participantId,
        type: "template" as const,
        templateName: selectedTemplate.template_name,
        languageCode: selectedTemplate.lang_code,
        components: payload
      })
    })
      .then(() => {
        setShowTemplateModal(false);
        setSelectedTemplate(null);
        setTemplateSearch("");
        setVarInputs({});
        setHeaderImageUrl("");
        setButtonInputs({ thumbnail_product_retailer_id:"", title:"", product_items:"" });
        setUrlInputs({});  
      })
      .catch(console.error);
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
      <Modal
        open={showTemplateModal}
        onClose={()=>{
          setShowTemplateModal(false);
          setSelectedTemplate(null);
          setTemplateSearch("");
          setVarInputs({});
          setHeaderImageUrl("");
          setButtonInputs({ thumbnail_product_retailer_id:"", title:"", product_items:"" }); //NEW
          setUrlInputs({});                                                               //NEW
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
              <Box sx={{ flex:1, overflowY:"auto" }}>
                <Grid container spacing={2} sx={{ fontWeight:"bold", mb:1 }}>
                  <Grid item xs={4} sx={{ color:"#fff" }}>Name</Grid>
                  <Grid item xs={8} sx={{ color:"#fff" }}>Text</Grid>
                </Grid>
                {filteredTemplates.map(t=>{
                  const txt = t.all_component?.find(c=>c.type==="BODY")?.text||"";
                  return (
                    <Grid
                      container spacing={2} key={t.id}
                      onClick={()=>handleSelectTemplate(t)}
                      sx={{ cursor:"pointer", py:1, "&:hover":{ backgroundColor:"action.hover" } }}
                    >
                      <Grid item xs={4} sx={{ color:"#fff" }}>{t.template_name}</Grid>
                      <Grid item xs={8} sx={{ whiteSpace:"pre-wrap", typography:"body2", color:"#fff" }}>{txt}</Grid>
                    </Grid>
                  );
                })}
                {templates.length===0 && <Box sx={{ textAlign:"center", py:2, color:"#fff" }}>No templates available.</Box>}
                {templates.length>0 && filteredTemplates.length===0 && <Box sx={{ textAlign:"center", py:2, color:"#fff" }}>No templates match your search.</Box>}
              </Box>
            </>
          ) : (
            <Box sx={{ display:"flex", flexDirection:"column", flex:1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Box
                  component="button"
                  type="button"
                  aria-label="Back to templates"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setVarInputs({});
                    setHeaderImageUrl("");
                    setButtonInputs({ thumbnail_product_retailer_id:"", title:"", product_items:"" });
                    setUrlInputs({});
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
              <Typography variant="body2" sx={{ whiteSpace:"pre-wrap", mb:2, opacity:0.8 }}>
                { (selectedTemplate.all_component?.find(c=>c.type==="BODY")?.text)||"" }
              </Typography>

              <Box sx={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:2 }}>
                {/* HEADER image input */}
                {selectedTemplate.all_component?.some(c=>c.type==="HEADER" && c.format==="IMAGE") && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                      gap: 2,
                    }}
                  >
                    <Typography sx={{ width: { xs: "auto", sm: 120 }, color:"#fff" }}>Image URL</Typography>
                    <Input
                      placeholder="Enter image URL"
                      value={headerImageUrl}
                      onChange={e=>setHeaderImageUrl(e.target.value)}
                      style={{ background:"transparent", color:"#fff" }}
                    />
                  </Box>
                )}

                {/* BODY inputs */}
                {Object.entries(varInputs).map(([i,v])=>(
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                      gap: 2,
                    }}
                  >
                    <Typography sx={{ width: { xs: "auto", sm: 120 }, color:"#fff" }}>{'{{'+i+'}}'}</Typography>
                    <Input
                      placeholder="Enter value"
                      value={v}
                      onChange={e=>setVarInputs(old=>({...old,[i]:e.target.value}))}
                      style={{ background:"transparent", color:"#fff" }}
                    />
                  </Box>
                ))}

                {/* MPM inputs */}
                {selectedTemplate.all_component?.find(c=>c.type==="BUTTONS")?.buttons?.some(b=>b.type.toLowerCase()==="mpm") && (
                  <>
                    <Typography sx={{ color:"#fff", mt:2 }}>MPM Button Action Parameters</Typography>
                    <Input
                      placeholder="Thumbnail Product Retailer ID"
                      value={buttonInputs.thumbnail_product_retailer_id}
                      onChange={e=>setButtonInputs(b=>({...b,thumbnail_product_retailer_id:e.target.value}))}
                      style={{ background:"transparent", color:"#fff" }}
                    />
                    <Input
                      placeholder="Section Title"
                      value={buttonInputs.title}
                      onChange={e=>setButtonInputs(b=>({...b,title:e.target.value}))}
                      style={{ background:"transparent", color:"#fff" }}
                    />
                    <Input
                      placeholder="Product Items (comma-separated)"
                      value={buttonInputs.product_items}
                      onChange={e=>setButtonInputs(b=>({...b,product_items:e.target.value}))}
                      style={{ background:"transparent", color:"#fff" }}
                    />
                  </>
                )}

                {/* URL inputs */}
                {selectedTemplate.all_component?.find(c=>c.type==="BUTTONS")?.buttons?.some(b=>b.type.toLowerCase()==="url") && (
                  <>
                    <Typography sx={{ color:"#fff", mt:2 }}>URL Button Parameters</Typography>
                    {Object.entries(urlInputs).map(([i,v])=>(
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "stretch", sm: "center" },
                          gap: 2,
                        }}
                      >
                        <Typography sx={{ width: { xs: "auto", sm: 120 }, color:"#fff" }}>{'{{'+i+'}}'}</Typography>
                        <Input
                          placeholder="Enter value"
                          value={v}
                          onChange={e=>setUrlInputs(old=>({...old,[i]:e.target.value}))}
                          style={{ background:"transparent", color:"#fff" }}
                        />
                      </Box>
                    ))}
                  </>
                )}
              </Box>

              <Box sx={{ mt:3, display:"flex", justifyContent:"flex-end" }}>
                <SendMessageButton onClick={handleSendTemplate}><Icon id="send"/></SendMessageButton>
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
    </Wrapper>
  );
}
