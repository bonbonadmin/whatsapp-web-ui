// /pages/chat/components/sidebar/index.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BsFillMoonFill, BsMoon } from "react-icons/bs";
import styled from "styled-components";
import InfiniteScroll from "react-infinite-scroll-component";
import axios from "axios";

import SidebarAlert from "./alert";
import InboxContact from "./contacts";
import OptionsMenu from "../option-menu";
import SearchField from "../search-field";
import Icon from "common/components/icons";
import { useAppTheme } from "common/theme";
import { Inbox } from "common/types/common.type";
import { useChatContext } from "pages/chat/context/chat";
import {
  Actions,
  ContactContainer,
  EndMessage,
  Header,
  ImageWrapper,
  Loader,
  SidebarContainer,
  ThemeIconContainer,
} from "./styles";
import ToggleSearch from "../search-toggle";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

// ------------------------------
// Helpers (normalize + safe parse)
// ------------------------------
const normBool = (v: any): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

const toMillis = (v?: string | null): number => {
  if (!v) return 0;
  let s = String(v).trim();
  if (s.includes(" ")) s = s.replace(" ", "T");
  s = s.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  s = s.replace(/([+-]\d{2})$/, "$1:00");
  s = s.replace(/\+00:00$/, "Z").replace(/\+00$/, "Z");
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
};

const pick = <T,>(obj: any, keys: string[], fallback?: T): T | undefined =>
  keys.reduce<any>((acc, k) => (acc !== undefined ? acc : obj?.[k]), undefined) ??
  fallback;

type WaLine = { id: string; number?: string };

// ------------------------------
// Component
// ------------------------------
export default function Sidebar() {
  const theme = useAppTheme();
  const navigate = useNavigate();
  const chatCtx = useChatContext();

  const handleChangeThemeMode = () => theme.onChangeThemeMode();

  const baseUrl =
    process.env.REACT_APP_API_URL?.replace(/\/+$/, "") || "/api";

  // WA lines
  const [waLines, setWaLines] = useState<WaLine[]>([]);
  const [selectedWaId, setSelectedWaId] = useState<string>("");

  // headers helper — ALWAYS a Record<string,string>
  const waHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {};
    if (selectedWaId) h["x-wa-id"] = selectedWaId;
    return h;
  }, [selectedWaId]);

  // 🔹 Reusable change handler: set state, persist, set axios default header, and fetch inbox
  const onChangeLine = useCallback(
    (id: string) => {
      setSelectedWaId(id);
      localStorage.setItem("wa:selectedId", id);

      // Set global axios default header so all axios requests include waId
      axios.defaults.headers.common["x-wa-id"] = id;

      // ensure we’re not in "unread only" mode, then fetch based on current search text
      chatCtx.onToggleSearch(false);
      chatCtx.onSearch(chatCtx.searchText || "");
    },
    [chatCtx]
  );

  // Theme-aware select with custom caret
  const LineSelectWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
`;

  const LineSelect = styled.select<{ $mode: "light" | "dark" }>`
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;

  min-width: 100px;
  max-width: 200px;
  padding: 8px 36px 8px 12px;
  border-radius: 10px;
  border: 1px solid
    ${({ $mode }) => ($mode === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)")};
  background: ${({ $mode }) =>
      $mode === "light" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.06)"};
  color: ${({ $mode }) => ($mode === "light" ? "#1f2937" : "#e5e7eb")};
  outline: none;
  transition: box-shadow 140ms ease, border-color 140ms ease, background 140ms ease;

  &:hover {
    border-color: ${({ $mode }) =>
      $mode === "light" ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.38)"};
  }

  &:focus {
    box-shadow: 0 0 0 3px
      ${({ $mode }) => ($mode === "light" ? "rgba(59,130,246,0.35)" : "rgba(96,165,250,0.35)")};
    border-color: ${({ $mode }) =>
      $mode === "light" ? "rgba(59,130,246,0.9)" : "rgba(96,165,250,0.9)"};
  }

  /* Make options readable in both modes (note: some browsers limit option styling) */
  & > option {
    background: ${({ $mode }) =>
      $mode === "light" ? "#ffffff" : "#1f2937"}; /* white / gray-800 */
    color: ${({ $mode }) => ($mode === "light" ? "#111827" : "#e5e7eb")}; /* gray-900 / gray-200 */
  }
`;

  const Caret = styled.span<{ $mode: "light" | "dark" }>`
  pointer-events: none;
  position: absolute;
  right: 10px;
  top: 50%;
  width: 16px;
  height: 16px;
  transform: translateY(-50%);
  display: inline-block;

  /* simple SVG chevron so it adapts to theme color */
  background-image: ${({ $mode }) =>
      `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none' stroke='${encodeURIComponent(
        $mode === "light" ? "#374151" : "#d1d5db"
      )}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 8 10 12 14 8'/></svg>")`};
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.9;
`;

  // 🔹 Fetch WA lines on mount and pick default (first one or stored one), then fetch inbox
  useEffect(() => {
    const cached = localStorage.getItem("wa:ids");
    const applyLines = (lines: WaLine[]) => {
      setWaLines(lines);

      // restore or set first id as default
      const storedId = localStorage.getItem("wa:selectedId") || lines[0]?.id || "";
      setSelectedWaId(storedId);

      if (storedId) {
        localStorage.setItem("wa:selectedId", storedId);
        axios.defaults.headers.common["x-wa-id"] = storedId; // make BE see it
        // kick an initial inbox load
        chatCtx.onSearch("");
      }
    };

    if (cached) {
      try {
        const lines = JSON.parse(cached) as WaLine[];
        if (Array.isArray(lines) && lines.length) {
          applyLines(lines);
          return; // ✅ no network call
        }
      } catch { }
    }

    // Fallback: fetch once and cache
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/wa/ids`);
        const json = await res.json();
        const lines: WaLine[] = Array.isArray(json?.lines) ? json.lines : [];
        localStorage.setItem("wa:ids", JSON.stringify(lines));
        applyLines(lines);
      } catch (e) {
        console.error("Failed to load WA IDs", e);
        setWaLines([]);
        setSelectedWaId("");
        delete axios.defaults.headers.common["x-wa-id"];
      }
    })();
    // empty deps => run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // open chat, keep waId in URL
  const handleChangeChat = (chat: Inbox) => {
    chatCtx.onChangeChat(chat);
    chatCtx.onFirstOpenChat(true);
    const q = selectedWaId ? `?waId=${encodeURIComponent(selectedWaId)}` : "";
    navigate("/" + chat.participantId + q);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
  };

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  // Pin overlay (optimistic UI)
  const [pinOverlay, setPinOverlay] = useState<
    Record<string, { isPinned: boolean; pinnedAt: string | null }>
  >({});

  // Normalize + merge overlay
  const mergedInbox: Inbox[] = useMemo(() => {
    const list = Array.isArray(chatCtx.inbox) ? chatCtx.inbox : [];
    return list.map((x: any) => {
      const basePinned = normBool(pick(x, ["isPinned", "is_pinned"], false));
      const basePinnedAt = pick<string | null>(x, ["pinnedAt", "pinned_at"], null);
      const baseLastTs =
        pick<string>(x, ["lastMessageAt", "last_message_at"]) ??
        pick<string>(x, ["createdAt", "created_at"]) ??
        pick<string>(x, ["updatedAt", "updated_at"]) ??
        null;

      const overlay = pinOverlay[x.participantId];
      const isPinned = overlay?.isPinned ?? basePinned;
      const pinnedAt = overlay?.pinnedAt ?? basePinnedAt;

      return { ...x, isPinned, pinnedAt, timestamp: baseLastTs } as Inbox;
    });
  }, [chatCtx.inbox, pinOverlay]);

  // Sort
  const sortedInbox: Inbox[] = useMemo(() => {
    const arr = [...mergedInbox];
    arr.sort((a: any, b: any) => {
      const ap = a.isPinned ? 1 : 0;
      const bp = b.isPinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const apin = toMillis(a.pinnedAt);
      const bpin = toMillis(b.pinnedAt);
      if (apin !== bpin) return bpin - apin;
      const at = toMillis(a.timestamp);
      const bt = toMillis(b.timestamp);
      return bt - at;
    });
    return arr;
  }, [mergedInbox]);

  // Optimistic toggle with rollback
  const togglePin = async (participantId: string, next: boolean) => {
    const now = new Date().toISOString();
    setPinOverlay((prev) => ({
      ...prev,
      [participantId]: { isPinned: next, pinnedAt: next ? now : null },
    }));

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...waHeaders,
      };
      const res = await fetch(
        `${baseUrl}/message-inbox/${encodeURIComponent(participantId)}/pin`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ isPinned: next }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      setPinOverlay((prev) => ({
        ...prev,
        [participantId]: {
          isPinned: normBool(json?.data?.is_pinned),
          pinnedAt: json?.data?.pinned_at ?? null,
        },
      }));
    } catch {
      setPinOverlay((prev) => ({
        ...prev,
        [participantId]: { isPinned: !next, pinnedAt: !next ? now : null },
      }));
    }
  };

  const handleTemplateUpdate = async () => {
    try {
      if (!selectedWaId) {
        setUpdateMessage("Please select a WhatsApp line first.");
        setShowUpdateModal(true);
        return;
      }
      const res = await fetch(`${baseUrl}/template-update`, {
        method: "GET",
        headers: waHeaders, // send selected waId
      });
      const json = await res.json();
      setUpdateMessage(json?.message ?? "Done");
    } catch (err: any) {
      setUpdateMessage(err?.message || "Error");
    } finally {
      setShowUpdateModal(true);
    }
  };

  return (
    <SidebarContainer customStyles={{ overflow: "hidden" }}>
      <Header>
        {/* <ImageWrapper><img src="/assets/images/profile.png" alt="" /></ImageWrapper> */}
        <Actions>
          {/* WA selector (left of Logout) */}
          <LineSelectWrap>
            <LineSelect
              $mode={theme.mode}
              aria-label="Select WhatsApp line"
              value={selectedWaId}
              onChange={(e) => onChangeLine(e.target.value)}
            >
              {waLines.length === 0 && <option value="">No WA lines</option>}
              {waLines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.number ? `${l.number} · ${l.id}` : l.id}
                </option>
              ))}
            </LineSelect>
            <Caret $mode={theme.mode} />
          </LineSelectWrap>

          <button
            aria-label="Logout"
            onClick={handleLogout}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon id="logout" className="icon" />
          </button>
          <button
            aria-label="Update Templates"
            onClick={handleTemplateUpdate}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon id="sync" className="icon" />
          </button>
          <ThemeIconContainer onClick={handleChangeThemeMode}>
            {theme.mode === "light" ? <BsMoon /> : <BsFillMoonFill />}
          </ThemeIconContainer>
        </Actions>
      </Header>

      {/* <SidebarAlert /> */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 8px" }}>
        <div style={{ flex: 1 }}>
          <SearchField />
        </div>
        <div>
          <ToggleSearch />
        </div>
      </div>

      <ContactContainer id="scrollableDiv" style={{ overflow: "auto", height: "80vh" }}>
        <InfiniteScroll
          dataLength={sortedInbox.length}
          next={chatCtx.loadMore}
          hasMore={chatCtx.hasMore}
          loader={<Loader>Loading..</Loader>}
          endMessage={<EndMessage>No more chats</EndMessage>}
          scrollableTarget="scrollableDiv"
        >
          {sortedInbox.map((inbox) => (
            <InboxContact
              key={inbox.id}
              inbox={inbox}
              isActive={inbox.id === chatCtx.activeChat?.id}
              onChangeChat={handleChangeChat}
              onTogglePin={togglePin}
            />
          ))}
        </InfiniteScroll>
      </ContactContainer>

      <Modal
        open={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        aria-labelledby="update-templates-title"
        aria-describedby="update-templates-description"
      >
        <Box
          sx={{
            position: "absolute" as const,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#323739",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            color: "#fff",
            minWidth: 300,
          }}
        >
          <Typography id="update-templates-title" variant="h6" sx={{ mb: 2 }}>
            Template Update
          </Typography>
          <Typography id="update-templates-description" sx={{ mb: 3 }}>
            {updateMessage}
          </Typography>
          <Button
            variant="contained"
            onClick={() => setShowUpdateModal(false)}
            sx={{ backgroundColor: "#555" }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </SidebarContainer>
  );
}