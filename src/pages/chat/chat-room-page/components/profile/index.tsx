import React, { useEffect, useMemo, useState } from "react";
import { useChatContext } from "pages/chat/context/chat";
import { useLocation } from "react-router-dom";
import Icon from "common/components/icons";
import {
  AboutItem,
  ActionSection,
  ActionText,
  Avatar,
  AvatarWrapper,
  Heading,
  HeadingWrapper,
  MediaButton,
  MediaImage,
  MediaImagesWrapper,
  PersonalInfo,
  ProfileName,
  Section,
  Wrapper,
} from "./styles";

const baseUrl = process.env.REACT_APP_API_URL ?? "";

type ProfileSectionProps = {
  name: string;
  image: string;
  phoneNumber: string; // participant_id
  events?: { event_name: string; started_at: string }[];
};

type SessionIdsResponse = {
  session_ids: string[];
  count: number;
  active_session_id: string | null;
  participant_id?: string | null;
  display_phone_id?: string | null;
};

function formatEventDate(iso?: string) {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

export default function ProfileSection(props: ProfileSectionProps) {
  const { name, image, phoneNumber, events } = props;
  const chatCtx = useChatContext();
  const location = useLocation();

  // ---- Handover state ----
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>("__NONE__"); // "__NONE__" means null on submit
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>("");

  const waManualLink = useMemo(() => {
    const digits = String(phoneNumber || "").replace(/[^\d]/g, ""); // keep numbers only
    if (!digits) return "";
    return `https://api.whatsapp.com/send/?phone=${encodeURIComponent(digits)}`;
  }, [phoneNumber]);

  // waId from active chat
  const waFromChat = useMemo<string>(() => {
    const ac: any = chatCtx?.activeChat || {};
    return String(ac.display_phone_id ?? ac.waId ?? ac.displayWaId ?? "").trim();
  }, [chatCtx?.activeChat]);

  // waId from URL (?waId=) OR localStorage (fallback)
  const selectedWaId = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const q = (qs.get("waId") || "").trim();
    if (q) return q;
    return localStorage.getItem("wa:selectedId") || "";
  }, [location.search]);

  // effective waId used for requests + display
  const waId = selectedWaId || waFromChat;

  // headers that include x-wa-id (backend's getWaFromReq reads this)
  const waHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {};
    if (waId) h["x-wa-id"] = waId; // 👈 IMPORTANT
    return h;
  }, [waId]);

  const handleLoadAll = () => {
    chatCtx.reloadMessages(-1); // 👈 ask provider to fetch ALL messages
  };
  console.log("Test", phoneNumber);
  

  useEffect(() => {
    let cancelled = false;
    setLoadingSessions(true);
    setSaveMsg("");

    // send both query params + header, so backend can read either way
    const qs = new URLSearchParams();
    if (phoneNumber) qs.set("participant_id", phoneNumber);
    if (waId) qs.set("waId", waId);

    fetch(`${baseUrl}/handover/session-ids?${qs.toString()}`, {
      method: "GET",
      headers: waHeaders,
      cache: "no-store",
    })
      .then(async (r) => {
        if (r.status === 304) return; // 👈 nothing to parse
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data: SessionIdsResponse = await r.json();
        if (cancelled) return;

        const unique = Array.from(new Set((data?.session_ids ?? []).filter(Boolean)));
        const active = data?.active_session_id ?? null;
        if (active && !unique.includes(active)) unique.unshift(active);
        setSessionIds(unique);
        setSelectedSession(active ?? "__NONE__");
      })
      .catch((err) => {
        console.error("Failed to load session ids:", err);
        if (!cancelled) setSessionIds([]);
      })
      .finally(() => !cancelled && setLoadingSessions(false));

    return () => { cancelled = true; };
  }, [phoneNumber, waId, waHeaders]); // 👈 re-run if waId changes

  const onSubmitHandover = async () => {
    setSaving(true);
    setSaveMsg("");

    try {
      if (!phoneNumber) throw new Error("Missing participant_id (phoneNumber).");
      if (!waId) throw new Error("Missing display_phone_id (waId).");

      const payload = {
        participant_id: phoneNumber,
        display_phone_id: waId, // send in body…
        session_id: selectedSession === "__NONE__" ? null : selectedSession,
      };

      const res = await fetch(`${baseUrl}/handover/update-session-id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...waHeaders, // …and also as header
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setSaveMsg("Handover saved ✓");
    } catch (e: any) {
      setSaveMsg(`Failed: ${e?.message || String(e)}`);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Wrapper>
      <PersonalInfo>
        {/* <AvatarWrapper>
          <Avatar src={image} alt="User Profile" />
        </AvatarWrapper> */}
        <ProfileName>{name}</ProfileName>
      </PersonalInfo>

      {/* <Section>
        <HeadingWrapper>
          <Heading>Media, Links and Documents</Heading>
          <MediaButton>
            <Icon id="rightArrow" className="icon" />
          </MediaButton>
        </HeadingWrapper>
        <MediaImagesWrapper>
          <MediaImage src="/assets/images/placeholder.jpeg" alt="Media" />
          <MediaImage src="/assets/images/placeholder.jpeg" alt="Media" />
          <MediaImage src="/assets/images/placeholder.jpeg" alt="Media" />
        </MediaImagesWrapper>
      </Section> */}

      <Section>
        {/* <HeadingWrapper>
          <Heading>About and phone number</Heading>
        </HeadingWrapper> */}
        <ul>
          {/* <AboutItem>
            Everyone should learn how to program because it teaches you how to think.
          </AboutItem> */}
          <AboutItem>{phoneNumber}</AboutItem>
        </ul>
      </Section>

      <Section>
        <ul>
          {events?.length
            ? events.map((e, i) => (
              <AboutItem key={`${e.event_name}-${e.started_at}-${i}`}>
                {e.event_name} — {formatEventDate(e.started_at)}
              </AboutItem>
            ))
            : null}
        </ul>

      </Section>
      {/* --- New: Handover to Session --- */}
      <Section>
        <HeadingWrapper style={{ alignItems: "center", gap: 8 }}>
          <Heading>Handover to Session</Heading>
          {waId ? (
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              WA: {waId}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#a33" }}>
              No WA ID detected
            </span>
          )}
        </HeadingWrapper>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          <label style={{ fontSize: 14 }}>Session:</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            disabled={loadingSessions || saving}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
              minWidth: 220,
              background: "#fff",
            }}
          >
            <option value="__NONE__">No Session</option>
            {sessionIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>

          <button
            onClick={onSubmitHandover}
            disabled={saving || !waId}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: saving ? "#eee" : "#f7f7f7",
              cursor: saving || !waId ? "not-allowed" : "pointer",
            }}
            title={!waId ? "Cannot handover without a WA ID" : "Save handover"}
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <span style={{ fontSize: 12, marginLeft: 4, opacity: 0.85 }}>
            {loadingSessions ? "Loading sessions…" : saveMsg}
          </span>
        </div>
      </Section>
      {/* --- End Handover to Session --- */}

      {/* --- Manual Message Link --- */}
      <Section>
        {waManualLink ? (
          <a
            href={waManualLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "8px 0",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            Manual Message
          </a>
        ) : (
          <span style={{ fontSize: 14, opacity: 0.7 }}>Manual Message</span>
        )}
      </Section>

      {/* <ActionSection>
        <Icon id="block" className="icon" />
        <ActionText>Block</ActionText>
      </ActionSection> */}
      <ActionSection onClick={handleLoadAll} style={{ cursor: "pointer" }}>
        <Icon id="sync" className="icon" />
        <ActionText>Load all chats</ActionText>
      </ActionSection>
      {/* <ActionSection>
        <Icon id="delete" className="icon" />
        <ActionText>Delete chat</ActionText>
      </ActionSection> */}
    </Wrapper>
  );
}
