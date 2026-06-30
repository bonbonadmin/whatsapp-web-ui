// /pages/chat/components/sidebar/index.tsx
import { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BsFillMoonFill, BsListTask, BsMoon } from "react-icons/bs";
import InfiniteScroll from "react-infinite-scroll-component";
import axios from "axios";

import InboxContact from "./contacts";
import SearchField from "../search-field";
import ToggleSearch from "../search-toggle";
import Icon from "common/components/icons";
import { useAppTheme } from "common/theme";
import { Inbox } from "common/types/common.type";
import { useChatContext } from "pages/chat/context/chat";
import OpenAIQueuePanel from "pages/openai-queue/panel";
import {
  Actions,
  Caret,
  ContactContainer,
  EndMessage,
  Header,
  HeaderActionButton,
  HeaderTitle,
  HeaderTop,
  LineSelect,
  LineSelectWrap,
  Loader,
  QueueIconContainer,
  QueueModalShell,
  SidebarContainer,
  ThemeIconContainer,
  WaSelectorRow,
} from "./styles";

import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { clearAuthSession } from "common/auth/session";

// ------------------------------
// Helpers (normalize + safe parse)
// ------------------------------
const normBool = (v: any): boolean => v === true || v === 1 || v === "1" || v === "true";

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
  keys.reduce<any>((acc, k) => (acc !== undefined ? acc : obj?.[k]), undefined) ?? fallback;

type WaLine = { id: string; number?: string };

// ------------------------------
// Component
// ------------------------------
export default function Sidebar(props: { mobileVisible?: boolean }) {
  const { mobileVisible = true } = props;
  const theme = useAppTheme();
  const navigate = useNavigate();
  const chatCtx = useChatContext();

  const handleChangeThemeMode = () => theme.onChangeThemeMode();

  const baseUrl = process.env.REACT_APP_API_URL?.replace(/\/+$/, "") || "/api";

  // WA lines
  const [waLines, setWaLines] = useState<WaLine[]>([]);
  const [selectedWaId, setSelectedWaId] = useState<string>("");

  // headers helper — ALWAYS a Record<string,string>
  const waHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {};
    if (selectedWaId) h["x-wa-id"] = selectedWaId;
    return h;
  }, [selectedWaId]);

  // ------------------------------
  // ContactContainer scroll memory
  // ------------------------------
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const SCROLL_KEY = useMemo(() => {
    const wa = selectedWaId || "default";
    return `chat:sidebarScrollTop:${wa}`;
  }, [selectedWaId]);

  const saveScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    sessionStorage.setItem(SCROLL_KEY, String(el.scrollTop || 0));
  }, [SCROLL_KEY]);

  const restoreScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (!saved) return;

    const n = Number(saved);
    if (Number.isNaN(n)) return;

    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTop = n;
    });
  }, [SCROLL_KEY]);

  // Restore on mount
  useEffect(() => {
    restoreScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore when WA line changes
  useEffect(() => {
    restoreScroll();
  }, [selectedWaId, restoreScroll]);

  // After list size changes (e.g. inbox refresh), re-apply saved scroll gently
  useLayoutEffect(() => {
    restoreScroll();
  }, [restoreScroll, chatCtx.inbox?.length]);

  // 🔹 Reusable change handler
  const onChangeLine = useCallback(
    (id: string) => {
      setSelectedWaId(id);
      localStorage.setItem("wa:selectedId", id);
      axios.defaults.headers.common["x-wa-id"] = id;

      // Keep UX stable: close search toggle (optional) then re-run search with current text
      chatCtx.onToggleSearch(false);
      chatCtx.onSearch(chatCtx.searchText || "");

      // Restore scroll for this WA line (after inbox renders)
      restoreScroll();
    },
    [chatCtx, restoreScroll]
  );

  // 🔹 Fetch WA lines on mount (with local cache)
  useEffect(() => {
    const cached = localStorage.getItem("wa:ids");

    const applyLines = (lines: WaLine[]) => {
      setWaLines(lines);

      const storedId = localStorage.getItem("wa:selectedId") || lines[0]?.id || "";
      setSelectedWaId(storedId);

      if (storedId) {
        localStorage.setItem("wa:selectedId", storedId);
        axios.defaults.headers.common["x-wa-id"] = storedId;
      } else {
        delete axios.defaults.headers.common["x-wa-id"];
      }

      // NOTE: do NOT force-clear/reload here.
      // Let ChatProvider handle initial fetch / polling.
      // If you *do* want to fetch immediately, do it via chatCtx.onSearch(...)
      // after you update ChatProvider to not clear inbox.
    };

    if (cached) {
      try {
        const lines = JSON.parse(cached) as WaLine[];
        if (Array.isArray(lines) && lines.length) {
          applyLines(lines);
          return;
        }
      } catch {
        // ignore and refetch
      }
    }

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
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const [showQueueModal, setShowQueueModal] = useState(false);
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

  const openQueueParticipant = useCallback(
    (participantId: string) => {
      const id = participantId.trim();
      if (!id) return;

      const chat =
        mergedInbox.find((item) => item.participantId === id) ??
        ({
          id,
          participantId: id,
          name: id,
          image: "/assets/images/boy4.jpeg",
          updatedAt: "",
        } as Inbox);

      setShowQueueModal(false);
      chatCtx.onChangeChat(chat);
      chatCtx.onFirstOpenChat(true);

      const q = selectedWaId ? `?waId=${encodeURIComponent(selectedWaId)}` : "";
      navigate("/" + id + q);
    },
    [chatCtx, mergedInbox, navigate, selectedWaId]
  );

  // Sort (pinned first, then pinnedAt desc, then timestamp desc)
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

      const res = await fetch(`${baseUrl}/message-inbox/${encodeURIComponent(participantId)}/pin`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isPinned: next }),
      });

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
        headers: waHeaders,
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
    <SidebarContainer
      data-mobile-visible={mobileVisible ? "true" : "false"}
      customStyles={{ overflow: "hidden" }}
    >
      <Header>
        <HeaderTop>
          <HeaderTitle>Eventory Chats</HeaderTitle>
          <Actions>
            <ThemeIconContainer
              aria-label="Toggle theme"
              onClick={handleChangeThemeMode}
              type="button"
            >
              {theme.mode === "light" ? <BsMoon /> : <BsFillMoonFill />}
            </ThemeIconContainer>

            <QueueIconContainer
              aria-label="OpenAI Queue"
              title="OpenAI Queue"
              onClick={() => setShowQueueModal(true)}
              type="button"
            >
              <BsListTask />
            </QueueIconContainer>

            <HeaderActionButton
              aria-label="Update Templates"
              onClick={handleTemplateUpdate}
              type="button"
            >
              <Icon id="sync" className="icon" />
            </HeaderActionButton>

            <HeaderActionButton aria-label="Logout" onClick={handleLogout} type="button">
              <Icon id="logout" className="icon" />
            </HeaderActionButton>
          </Actions>
        </HeaderTop>

        <WaSelectorRow>
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
        </WaSelectorRow>
      </Header>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 8px",
        }}
      >
        <div style={{ flex: 1 }}>
          <SearchField />
        </div>
        <div>
          <ToggleSearch />
        </div>
      </div>

      <ContactContainer id="scrollableDiv" ref={scrollRef} onScroll={saveScroll}>
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
        open={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        aria-labelledby="openai-queue-title"
      >
        <QueueModalShell>
          {showQueueModal && (
            <OpenAIQueuePanel
              embedded
              onClose={() => setShowQueueModal(false)}
              onParticipantClick={openQueueParticipant}
            />
          )}
        </QueueModalShell>
      </Modal>

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
