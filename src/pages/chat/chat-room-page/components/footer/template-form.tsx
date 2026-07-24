import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import {
  MdImage,
  MdVideocam,
  MdInsertDriveFile,
  MdOpenInNew,
  MdLink,
  MdReply,
  MdStorefront,
  MdContentCopy,
  MdCall,
} from "react-icons/md";
import Icon from "common/components/icons";

export interface WhatsappComponent {
  text?: string;
  type: string;
  format?: string;
  buttons?: any[];
  example?: Record<string, any>;
}

export interface WhatsappTemplate {
  id: number;
  template_name: string;
  all_component: WhatsappComponent[];
  lang_code: string;
}

type HeaderKind = "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
type LoadStatus = "idle" | "loading" | "ready" | "error";

interface ParsedButton {
  index: number;
  subtype: string;
  text: string;
  url: string;
  urlVars: string[];
  urlExamples: string[];
}

interface ParsedTemplate {
  headerKind: HeaderKind;
  headerText: string;
  headerVars: string[];
  headerExamples: string[];
  bodyText: string;
  bodyVars: string[];
  bodyExamples: string[];
  footerText: string;
  buttons: ParsedButton[];
}

const BUBBLE_BG = "#005c4b";
const PREVIEW_BG = "#0b141a";
const ACCENT = "#00a884";
const LINK_BLUE = "#53bdeb";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: "10px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
    "&.Mui-focused fieldset": { borderColor: ACCENT },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
  "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
  "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.5)" },
  "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.42)", opacity: 1 },
};

/* ------------------------------------------------------------------ parsing */

function extractVars(text?: string): string[] {
  const found: string[] = [];
  if (!text) return found;
  const re = /\{\{(\d+)\}\}/g;
  let match: RegExpExecArray | null = re.exec(text);
  while (match !== null) {
    if (found.indexOf(match[1]) === -1) found.push(match[1]);
    match = re.exec(text);
  }
  return found.sort((a, b) => Number(a) - Number(b));
}

/** Meta ships examples either as ["a","b"] or as [["a","b"]] depending on the field. */
function exampleList(example: any, key: string): string[] {
  const raw = example ? example[key] : undefined;
  if (!Array.isArray(raw)) return [];
  if (Array.isArray(raw[0])) return raw[0].map((value: any) => String(value));
  return raw.map((value: any) => String(value));
}

function parseTemplate(template: WhatsappTemplate): ParsedTemplate {
  const comps: WhatsappComponent[] = template.all_component ?? [];
  const header = comps.find((c) => c.type === "HEADER");
  const body = comps.find((c) => c.type === "BODY");
  const footer = comps.find((c) => c.type === "FOOTER");
  const rawButtons = comps.find((c) => c.type === "BUTTONS")?.buttons ?? [];

  let headerKind: HeaderKind = "NONE";
  if (header) {
    const format = (header.format || (header.text ? "TEXT" : "")).toUpperCase();
    headerKind = (["TEXT", "IMAGE", "VIDEO", "DOCUMENT", "LOCATION"].indexOf(format) >= 0
      ? format
      : "NONE") as HeaderKind;
  }

  return {
    headerKind,
    headerText: header?.text ?? "",
    headerVars: headerKind === "TEXT" ? extractVars(header?.text) : [],
    headerExamples: exampleList(header?.example, "header_text"),
    bodyText: body?.text ?? "",
    bodyVars: extractVars(body?.text),
    bodyExamples: exampleList(body?.example, "body_text"),
    footerText: footer?.text ?? "",
    buttons: rawButtons.map((button: any, index: number) => ({
      index,
      subtype: String(button?.type ?? "").toLowerCase(),
      text: button?.text ?? "",
      url: button?.url ?? "",
      urlVars: extractVars(button?.url),
      urlExamples: Array.isArray(button?.example)
        ? button.example.map((value: any) => String(value))
        : [],
    })),
  };
}

function fileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(last) || "document";
  } catch (error) {
    return "document";
  }
}

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

/* ------------------------------------------------------------------- render */

const WA_FORMAT_RE = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[\s\S]+?```)/g;
// Private-use sentinels mark substituted values so they can be underlined after formatting.
const VALUE_OPEN = "\uE000";
const VALUE_CLOSE = "\uE001";
const SEGMENT_RE = /(\uE000[^\uE001]*\uE001|\{\{\d+\}\})/;

/** Splits already-substituted text into value chips, placeholder chips and plain text. */
function renderSegments(text: string, keyPrefix: string): React.ReactNode[] {
  return text
    .split(SEGMENT_RE)
    .filter((part) => part !== "" && part !== undefined)
    .map((part, index) => {
      const key = `${keyPrefix}-s${index}`;
      if (part.charAt(0) === VALUE_OPEN) {
        return (
          <Box
            key={key}
            component="span"
            sx={{ borderBottom: "1px dashed rgba(255,255,255,0.35)" }}
          >
            {part.slice(1, -1)}
          </Box>
        );
      }
      if (/^\{\{\d+\}\}$/.test(part)) {
        return (
          <Box
            key={key}
            component="span"
            sx={{
              backgroundColor: "rgba(255,183,77,0.22)",
              border: "1px solid rgba(255,183,77,0.55)",
              borderRadius: "4px",
              color: "#ffcc80",
              fontSize: "0.82em",
              px: "4px",
            }}
          >
            {part}
          </Box>
        );
      }
      return <React.Fragment key={key}>{part}</React.Fragment>;
    });
}

/** Minimal WhatsApp markdown so the preview reads like the real bubble. */
function formatWhatsapp(text: string, keyPrefix: string): React.ReactNode[] {
  return text
    .split(WA_FORMAT_RE)
    .filter((part) => part !== "" && part !== undefined)
    .map((part, index) => {
      const key = `${keyPrefix}-f${index}`;
      const inner = (from: number, to: number) =>
        renderSegments(part.slice(from, to), key);
      if (/^\*[^*\n]+\*$/.test(part)) return <b key={key}>{inner(1, -1)}</b>;
      if (/^_[^_\n]+_$/.test(part)) return <i key={key}>{inner(1, -1)}</i>;
      if (/^~[^~\n]+~$/.test(part)) return <s key={key}>{inner(1, -1)}</s>;
      if (/^```[\s\S]+```$/.test(part))
        return (
          <Box key={key} component="code" sx={{ fontFamily: "monospace" }}>
            {inner(3, -3)}
          </Box>
        );
      return <React.Fragment key={key}>{renderSegments(part, key)}</React.Fragment>;
    });
}

/**
 * Renders template text with `{{n}}` swapped for the typed value. Unfilled slots
 * stay visible as amber chips so it is obvious what is still missing. Substitution
 * happens before formatting so `*{{1}}*` still renders bold.
 */
function renderWithValues(
  text: string,
  resolve: (index: string) => string,
  keyPrefix: string
): React.ReactNode[] {
  if (!text) return [];
  const substituted = text.replace(/\{\{(\d+)\}\}/g, (placeholder, index) => {
    const value = resolve(index).trim();
    return value ? VALUE_OPEN + value + VALUE_CLOSE : placeholder;
  });
  return formatWhatsapp(substituted, keyPrefix);
}

function useDebounced(value: string, delay = 450): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const kindIcon = (kind: HeaderKind, size: number) => {
  if (kind === "VIDEO") return <MdVideocam size={size} />;
  if (kind === "DOCUMENT") return <MdInsertDriveFile size={size} />;
  return <MdImage size={size} />;
};

const kindLabel = (kind: HeaderKind) =>
  kind === "VIDEO" ? "video" : kind === "DOCUMENT" ? "document" : "image";

/** Lazily loads the pasted asset; falls back to a type icon when it can't be fetched. */
function MediaPreview({ url, kind }: { url: string; kind: HeaderKind }) {
  const debounced = useDebounced(url.trim());
  const valid = isHttpUrl(debounced);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [docMeta, setDocMeta] = useState("");

  useEffect(() => {
    setDocMeta("");
    if (!debounced) {
      setStatus("idle");
      return;
    }
    if (!valid) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    let cancelled = false;
    const done = (next: LoadStatus) => {
      if (!cancelled) setStatus(next);
    };

    // Fetch the asset off-screen first, then swap in the real element once it
    // resolves — a hidden <img>/<video> can't report its own load reliably.
    if (kind === "IMAGE") {
      const probe = new Image();
      probe.onload = () => done("ready");
      probe.onerror = () => done("error");
      probe.src = debounced;
      return () => {
        cancelled = true;
        probe.onload = null;
        probe.onerror = null;
      };
    }

    if (kind === "VIDEO") {
      const probe = document.createElement("video");
      probe.preload = "metadata";
      probe.muted = true;
      probe.onloadeddata = () => done("ready");
      probe.onloadedmetadata = () => done("ready");
      probe.onerror = () => done("error");
      probe.src = debounced;
      return () => {
        cancelled = true;
        probe.onloadeddata = null;
        probe.onloadedmetadata = null;
        probe.onerror = null;
        probe.removeAttribute("src");
      };
    }

    // A document can't be rendered inline, so the card always shows. The HEAD
    // probe only enriches it — plenty of hosts block HEAD or CORS while still
    // serving the file fine to WhatsApp.
    done("ready");
    fetch(debounced, { method: "HEAD" })
      .then((res) => {
        if (cancelled || !res.ok) return;
        const size = Number(res.headers.get("content-length"));
        const type = res.headers.get("content-type") || "";
        const parts = [
          type.split(";")[0].split("/").pop()?.toUpperCase(),
          size ? `${Math.max(1, Math.round(size / 1024))} KB` : "",
        ].filter(Boolean);
        setDocMeta(parts.join(" · "));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [debounced, valid, kind]);

  const frameSx = {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: "6px",
    color: "rgba(255,255,255,0.6)",
    display: "flex",
    flexDirection: "column",
    gap: 1,
    justifyContent: "center",
    minHeight: 132,
    p: 2,
    textAlign: "center",
  } as const;

  if (status === "idle") {
    return (
      <Box sx={{ ...frameSx, border: "1px dashed rgba(255,255,255,0.22)" }}>
        {kindIcon(kind, 34)}
        <Typography sx={{ fontSize: "0.72rem", opacity: 0.75 }}>
          {`Add ${kind === "IMAGE" ? "an" : "a"} ${kindLabel(kind)} URL to preview it here`}
        </Typography>
      </Box>
    );
  }

  if (status === "error" || !valid) {
    return (
      <Box sx={frameSx}>
        {kindIcon(kind, 34)}
        <Typography sx={{ fontSize: "0.72rem" }}>
          {valid
            ? `Couldn't load this ${kindLabel(kind)} — it will still be sent as-is`
            : "Enter a full https:// URL"}
        </Typography>
        {valid && (
          <Typography
            sx={{ fontSize: "0.68rem", opacity: 0.65, wordBreak: "break-all" }}
          >
            {fileNameFromUrl(debounced)}
          </Typography>
        )}
      </Box>
    );
  }

  if (kind === "DOCUMENT") {
    return (
      <Box
        sx={{
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.28)",
          borderRadius: "6px",
          display: "flex",
          gap: 1.5,
          p: 1.5,
        }}
      >
        <Box sx={{ color: "#f15c6d", display: "flex" }}>
          <MdInsertDriveFile size={30} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ color: "#fff", fontSize: "0.8rem", wordBreak: "break-all" }}
          >
            {fileNameFromUrl(debounced)}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem" }}>
            {docMeta || "Document"}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (status === "loading") {
    return (
      <Box
        sx={{
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.28)",
          borderRadius: "6px",
          display: "flex",
          justifyContent: "center",
          minHeight: 132,
        }}
      >
        <CircularProgress size={22} sx={{ color: "rgba(255,255,255,0.6)" }} />
      </Box>
    );
  }

  return kind === "VIDEO" ? (
    <Box
      component="video"
      src={debounced}
      controls
      muted
      playsInline
      preload="metadata"
      sx={{ borderRadius: "6px", display: "block", maxHeight: 220, width: "100%" }}
    />
  ) : (
    <Box
      component="img"
      src={debounced}
      alt="Header preview"
      sx={{
        borderRadius: "6px",
        display: "block",
        maxHeight: 220,
        objectFit: "cover",
        width: "100%",
      }}
    />
  );
}

function buttonIcon(subtype: string) {
  if (subtype === "url") return <MdOpenInNew size={15} />;
  if (subtype === "phone_number") return <MdCall size={15} />;
  if (subtype === "copy_code") return <MdContentCopy size={15} />;
  if (subtype === "catalog" || subtype === "mpm") return <MdStorefront size={15} />;
  return <MdReply size={15} />;
}

/* -------------------------------------------------------------- the composer */

interface TemplateFormProps {
  template: WhatsappTemplate;
  sending?: boolean;
  errorMessage?: string;
  onBack: () => void;
  onSend: (components: any[]) => void;
}

export default function TemplateForm(props: TemplateFormProps) {
  const { template, sending, errorMessage, onBack, onSend } = props;
  const parsed = useMemo(() => parseTemplate(template), [template]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  const isMediaHeader =
    parsed.headerKind === "IMAGE" ||
    parsed.headerKind === "VIDEO" ||
    parsed.headerKind === "DOCUMENT";

  const get = (key: string) => values[key] ?? "";
  const set = (key: string, value: string) =>
    setValues((old) => ({ ...old, [key]: value }));

  /** Every field the user must fill before the template is sendable. */
  const requiredKeys = useMemo(() => {
    const keys: { key: string; label: string }[] = [];
    if (isMediaHeader)
      keys.push({ key: "header.media", label: `Header ${kindLabel(parsed.headerKind)} URL` });
    parsed.headerVars.forEach((v) => keys.push({ key: `header.${v}`, label: `Header {{${v}}}` }));
    parsed.bodyVars.forEach((v) => keys.push({ key: `body.${v}`, label: `Body {{${v}}}` }));
    parsed.buttons.forEach((button) => {
      button.urlVars.forEach((v) =>
        keys.push({ key: `btn.${button.index}.url.${v}`, label: `Link {{${v}}}` })
      );
      if (button.subtype === "catalog")
        keys.push({ key: `btn.${button.index}.thumb`, label: "Catalog thumbnail SKU" });
      if (button.subtype === "mpm") {
        keys.push({ key: `btn.${button.index}.thumb`, label: "Thumbnail SKU" });
        keys.push({ key: `btn.${button.index}.title`, label: "Section title" });
        keys.push({ key: `btn.${button.index}.items`, label: "Product SKUs" });
      }
      if (button.subtype === "copy_code")
        keys.push({ key: `btn.${button.index}.code`, label: "Coupon code" });
    });
    return keys;
  }, [parsed, isMediaHeader]);

  const missing = requiredKeys.filter((field) => !get(field.key).trim());
  const filledCount = requiredKeys.length - missing.length;

  const buildComponents = (): any[] => {
    const components: any[] = [];

    if (isMediaHeader) {
      const link = get("header.media").trim();
      if (link) {
        const media =
          parsed.headerKind === "IMAGE"
            ? { type: "image" as const, image: { link } }
            : parsed.headerKind === "VIDEO"
            ? { type: "video" as const, video: { link } }
            : {
                type: "document" as const,
                document: { link, filename: fileNameFromUrl(link) },
              };
        components.push({ type: "header" as const, parameters: [media] });
      }
    } else if (parsed.headerVars.length) {
      components.push({
        type: "header" as const,
        parameters: parsed.headerVars.map((v) => ({
          type: "text" as const,
          text: get(`header.${v}`),
        })),
      });
    }

    if (parsed.bodyVars.length) {
      components.push({
        type: "body" as const,
        parameters: parsed.bodyVars.map((v) => ({
          type: "text" as const,
          text: get(`body.${v}`),
        })),
      });
    }

    parsed.buttons.forEach((button) => {
      const { subtype, index } = button;
      if (subtype === "url") {
        const parameters = button.urlVars.map((v) => ({
          type: "text" as const,
          text: get(`btn.${index}.url.${v}`),
        }));
        components.push({
          type: "button" as const,
          sub_type: "url",
          index,
          ...(parameters.length ? { parameters } : {}),
        });
      } else if (subtype === "mpm") {
        const items = get(`btn.${index}.items`)
          .split(/[\n,]/)
          .map((sku) => sku.trim())
          .filter(Boolean)
          .map((sku) => ({ product_retailer_id: sku }));
        components.push({
          type: "button" as const,
          sub_type: "mpm",
          index,
          parameters: [
            {
              type: "action" as const,
              action: {
                thumbnail_product_retailer_id: get(`btn.${index}.thumb`).trim(),
                sections: [{ title: get(`btn.${index}.title`).trim(), product_items: items }],
              },
            },
          ],
        });
      } else if (subtype === "catalog") {
        const thumb = get(`btn.${index}.thumb`).trim();
        components.push({
          type: "button" as const,
          sub_type: "CATALOG",
          index,
          ...(thumb
            ? {
                parameters: [
                  {
                    type: "action" as const,
                    action: { thumbnail_product_retailer_id: thumb },
                  },
                ],
              }
            : {}),
        });
      } else if (subtype === "copy_code") {
        components.push({
          type: "button" as const,
          sub_type: "copy_code",
          index,
          parameters: [
            { type: "coupon_code" as const, coupon_code: get(`btn.${index}.code`).trim() },
          ],
        });
      } else if (subtype === "flow") {
        components.push({ type: "button" as const, sub_type: "flow", index });
      }
    });

    return components;
  };

  const handleSend = () => {
    setTouched(true);
    if (missing.length || sending) return;
    onSend(buildComponents());
  };

  const showError = (key: string) => touched && !get(key).trim();

  const field = (
    key: string,
    label: string,
    placeholder?: string,
    extra?: { multiline?: boolean; helperText?: string; required?: boolean }
  ) => (
    <TextField
      key={key}
      value={get(key)}
      onChange={(event) => set(key, event.target.value)}
      label={label}
      placeholder={placeholder}
      size="small"
      fullWidth
      multiline={extra?.multiline}
      minRows={extra?.multiline ? 2 : undefined}
      InputLabelProps={{ shrink: true }}
      error={extra?.required !== false && showError(key)}
      helperText={
        extra?.required !== false && showError(key) ? "Required" : extra?.helperText
      }
      sx={fieldSx}
    />
  );

  const sectionTitle = (text: string) => (
    <Typography
      sx={{
        color: "rgba(255,255,255,0.55)",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </Typography>
  );

  const resolveBody = (index: string) => get(`body.${index}`);
  const resolveHeader = (index: string) => get(`header.${index}`);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* ------------------------------------------------------------ toolbar */}
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, mb: 2 }}>
        <Box
          component="button"
          type="button"
          aria-label="Back to templates"
          onClick={onBack}
          sx={{
            alignItems: "center",
            background: "transparent",
            border: 0,
            borderRadius: "50%",
            color: "#fff",
            cursor: "pointer",
            display: "inline-flex",
            flexShrink: 0,
            height: 36,
            justifyContent: "center",
            p: 0,
            width: 36,
            "&:hover": { backgroundColor: "action.hover" },
            "& .icon": { height: 24, width: 24 },
          }}
        >
          <Icon id="back" className="icon" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.2, overflowWrap: "anywhere" }}>
            {template.template_name}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem" }}>
            {template.lang_code}
            {requiredKeys.length > 0 &&
              ` · ${filledCount}/${requiredKeys.length} fields filled`}
          </Typography>
        </Box>
      </Box>

      {/* ----------------------------------------------------- two-pane layout */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          minHeight: 0,
          // On narrow screens the two panes stack and scroll together.
          overflowY: { xs: "auto", md: "visible" },
        }}
      >
        {/* left: inputs */}
        <Box
          sx={{
            display: "flex",
            flex: { xs: "0 0 auto", md: 1 },
            flexDirection: "column",
            gap: 2,
            minHeight: 0,
            overflowY: { xs: "visible", md: "auto" },
            pr: { md: 1 },
          }}
        >
          {requiredKeys.length === 0 && (
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
              This template has no variables — just hit send.
            </Typography>
          )}

          {isMediaHeader && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {sectionTitle(`Header ${kindLabel(parsed.headerKind)}`)}
              {field(
                "header.media",
                `${kindLabel(parsed.headerKind).replace(/^./, (c) => c.toUpperCase())} URL`,
                "https://…",
                {
                  helperText:
                    "Must be a public URL. The preview loads once it's reachable.",
                }
              )}
            </Box>
          )}

          {parsed.headerVars.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sectionTitle("Header variables")}
              {parsed.headerVars.map((v, i) =>
                field(`header.${v}`, `{{${v}}}`, parsed.headerExamples[i] || "Enter value")
              )}
            </Box>
          )}

          {parsed.bodyVars.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sectionTitle("Body variables")}
              {parsed.bodyVars.map((v, i) =>
                field(`body.${v}`, `{{${v}}}`, parsed.bodyExamples[i] || "Enter value")
              )}
            </Box>
          )}

          {parsed.buttons.map((button) => {
            const needsInput =
              button.urlVars.length > 0 ||
              button.subtype === "catalog" ||
              button.subtype === "mpm" ||
              button.subtype === "copy_code";
            if (!needsInput) return null;
            const prefix = `btn.${button.index}`;
            return (
              <Box
                key={prefix}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                {sectionTitle(
                  `${button.text || button.subtype} button`.trim()
                )}
                {button.urlVars.map((v, i) =>
                  field(
                    `${prefix}.url.${v}`,
                    `Link {{${v}}}`,
                    button.urlExamples[i] || "Enter value",
                    { helperText: button.url || undefined }
                  )
                )}
                {button.subtype === "catalog" &&
                  field(`${prefix}.thumb`, "Thumbnail product SKU", "e.g. SKU-12345", {
                    helperText: "Catalog ID of the item shown as the thumbnail.",
                  })}
                {button.subtype === "mpm" && (
                  <>
                    {field(`${prefix}.thumb`, "Thumbnail product SKU", "e.g. SKU-12345")}
                    {field(`${prefix}.title`, "Section title", "e.g. Best sellers")}
                    {field(
                      `${prefix}.items`,
                      "Product SKUs",
                      "SKU-1, SKU-2, SKU-3",
                      {
                        multiline: true,
                        helperText: "Separate each catalog item ID with a comma or new line.",
                      }
                    )}
                  </>
                )}
                {button.subtype === "copy_code" &&
                  field(`${prefix}.code`, "Coupon code", "e.g. SAVE20")}
              </Box>
            );
          })}
        </Box>

        {/* right: live preview */}
        <Box
          sx={{
            backgroundColor: PREVIEW_BG,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            display: "flex",
            flex: { xs: "0 0 auto", md: "0 0 360px" },
            flexDirection: "column",
            maxHeight: { xs: "40vh", md: "none" },
            minHeight: 0,
            order: { xs: -1, md: 0 },
            overflow: "hidden",
            // Keeps the bubble in view while filling fields on a phone.
            position: { xs: "sticky", md: "static" },
            top: 0,
            zIndex: 1,
          }}
        >
          <Typography
            sx={{
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.55)",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              px: 2,
              py: 1,
              textTransform: "uppercase",
            }}
          >
            Preview
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
            <Box
              sx={{
                backgroundColor: BUBBLE_BG,
                borderRadius: "8px",
                borderTopRightRadius: 0,
                boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                color: "#e9edef",
                ml: "auto",
                maxWidth: 320,
                p: 1,
              }}
            >
              {isMediaHeader && (
                <Box sx={{ mb: 1 }}>
                  <MediaPreview url={get("header.media")} kind={parsed.headerKind} />
                </Box>
              )}

              {parsed.headerKind === "TEXT" && parsed.headerText && (
                <Typography
                  sx={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    mb: 0.5,
                    px: 0.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {renderWithValues(parsed.headerText, resolveHeader, "hdr")}
                </Typography>
              )}

              <Typography
                sx={{
                  fontSize: "0.88rem",
                  lineHeight: 1.45,
                  px: 0.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {renderWithValues(parsed.bodyText, resolveBody, "body")}
              </Typography>

              {parsed.footerText && (
                <Typography
                  sx={{
                    color: "rgba(233,237,239,0.6)",
                    fontSize: "0.76rem",
                    mt: 0.5,
                    px: 0.5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {parsed.footerText}
                </Typography>
              )}

              <Typography
                sx={{
                  color: "rgba(233,237,239,0.6)",
                  fontSize: "0.68rem",
                  pr: 0.5,
                  textAlign: "right",
                }}
              >
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>

              {parsed.buttons.length > 0 && (
                <Box sx={{ mt: 0.5 }}>
                  {parsed.buttons.map((button) => (
                    <Box
                      key={`preview-btn-${button.index}`}
                      sx={{
                        alignItems: "center",
                        borderTop: "1px solid rgba(255,255,255,0.14)",
                        color: LINK_BLUE,
                        display: "flex",
                        fontSize: "0.84rem",
                        gap: 0.75,
                        justifyContent: "center",
                        py: 0.9,
                      }}
                    >
                      {buttonIcon(button.subtype)}
                      <span>{button.text || button.subtype}</span>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* resolved link targets, handy when a URL button carries a variable */}
            {parsed.buttons
              .filter((button) => button.subtype === "url" && button.urlVars.length > 0)
              .map((button) => (
                <Box
                  key={`resolved-${button.index}`}
                  sx={{
                    alignItems: "flex-start",
                    color: "rgba(255,255,255,0.5)",
                    display: "flex",
                    fontSize: "0.7rem",
                    gap: 0.5,
                    mt: 1.5,
                    wordBreak: "break-all",
                  }}
                >
                  <Box sx={{ display: "flex", pt: "2px" }}>
                    <MdLink size={13} />
                  </Box>
                  <span>
                    {renderWithValues(
                      button.url,
                      (i) => get(`btn.${button.index}.url.${i}`),
                      `url-${button.index}`
                    )}
                  </span>
                </Box>
              ))}
          </Box>
        </Box>
      </Box>

      {/* ------------------------------------------------------------- actions */}
      <Box
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          justifyContent: "space-between",
          mt: 2,
        }}
      >
        <Typography
          sx={{
            color: errorMessage ? "#f7a1a1" : "rgba(255,255,255,0.55)",
            fontSize: "0.75rem",
          }}
        >
          {errorMessage ||
            (missing.length
              ? `Fill in: ${missing
                  .slice(0, 3)
                  .map((field) => field.label)
                  .join(", ")}${missing.length > 3 ? ` +${missing.length - 3} more` : ""}`
              : "Ready to send")}
        </Typography>
        <Button
          onClick={handleSend}
          disabled={!!sending || missing.length > 0}
          variant="contained"
          startIcon={
            sending ? (
              <CircularProgress size={16} sx={{ color: "inherit" }} />
            ) : (
              <Icon id="send" />
            )
          }
          sx={{
            backgroundColor: ACCENT,
            borderRadius: "20px",
            flexShrink: 0,
            px: 3,
            textTransform: "none",
            "&:hover": { backgroundColor: "#029b7a" },
            "&.Mui-disabled": {
              backgroundColor: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.4)",
            },
            "& .icon, & svg": { height: 18, width: 18 },
          }}
        >
          {sending ? "Sending…" : "Send template"}
        </Button>
      </Box>
    </Box>
  );
}
