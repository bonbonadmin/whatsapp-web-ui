// /pages/chat/components/sidebar/index.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsFillMoonFill, BsMoon } from "react-icons/bs";
import InfiniteScroll from "react-infinite-scroll-component";

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
  Avatar,
  ContactContainer,
  EndMessage,
  Header,
  HeaderActionButton,
  ImageWrapper,
  Loader,
  MobileHeaderCopy,
  MobileHeaderTitle,
  SearchArea,
  SidebarContainer,
  ThemeIconContainer,
} from "./styles";
import ToggleSearch from "../search-toggle";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { clearAuthSession } from "common/auth/session";

// ------------------------------
// Helpers (normalize + safe parse)
// ------------------------------
const normBool = (v: any): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

const toMillis = (v?: string | null): number => {
  if (!v) return 0;
  let s = String(v).trim();

  // Space -> 'T'
  if (s.includes(" ")) s = s.replace(" ", "T");

  // Normalize timezone:
  //  +0700 -> +07:00
  s = s.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  //  +07 -> +07:00
  s = s.replace(/([+-]\d{2})$/, "$1:00");
  //  +00 or +00:00 -> Z
  s = s.replace(/\+00:00$/, "Z").replace(/\+00$/, "Z");

  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
};

const pick = <T,>(obj: any, keys: string[], fallback?: T): T | undefined =>
  keys.reduce<any>((acc, k) => (acc !== undefined ? acc : obj?.[k]), undefined) ??
  fallback;

// ------------------------------
// Component
// ------------------------------
export default function Sidebar(props: { mobileVisible?: boolean }) {
  const { mobileVisible = true } = props;
  const theme = useAppTheme();
  const navigate = useNavigate();
  const chatCtx = useChatContext();

  const handleChangeThemeMode = () => theme.onChangeThemeMode();

  const handleChangeChat = (chat: Inbox) => {
    chatCtx.onChangeChat(chat);
    chatCtx.onFirstOpenChat(true);
    navigate("/" + chat.participantId);
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateTitle, setUpdateTitle] = useState("Template Update");
  const [updateMessage, setUpdateMessage] = useState("");
  const [isKnowledgeSyncing, setIsKnowledgeSyncing] = useState(false);
  const baseUrl =
    process.env.REACT_APP_API_URL?.replace(/\/+$/, "") || "/api";
  const knowledgeBaseUrl = "https://wa-api.crystalsea.id";

  // ------------------------------------------------------------
  // Pin overlay (optimistic UI; we do not mutate chatCtx.inbox)
  // ------------------------------------------------------------
  const [pinOverlay, setPinOverlay] = useState<
    Record<string, { isPinned: boolean; pinnedAt: string | null }>
  >({});

  // Normalize server payload and merge overlay
  const mergedInbox: Inbox[] = useMemo(() => {
    const list = Array.isArray(chatCtx.inbox) ? chatCtx.inbox : [];
    return list.map((x: any) => {
      const basePinned = normBool(pick(x, ["isPinned", "is_pinned"], false));
      const basePinnedAt = pick<string | null>(x, ["pinnedAt", "pinned_at"], null);

      // Use last-message time from BE join: created_at (lp.max_time)
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

  // Sort: pinned first; within pinned => pinnedAt desc; then last message time desc
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

  // Optimistic toggle with rollback; overlay-only state
  const togglePin = async (participantId: string, next: boolean) => {
    const now = new Date().toISOString();

    // optimistic overlay
    setPinOverlay((prev) => ({
      ...prev,
      [participantId]: { isPinned: next, pinnedAt: next ? now : null },
    }));

    try {
      const res = await fetch(
        `${baseUrl}/message-inbox/${encodeURIComponent(participantId)}/pin`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
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
      // rollback
      setPinOverlay((prev) => ({
        ...prev,
        [participantId]: { isPinned: !next, pinnedAt: !next ? now : null },
      }));
    }
  };

  const handleTemplateUpdate = async () => {
    try {
      setUpdateTitle("Template Update");
      const res = await fetch(`${baseUrl}/template-update`, { method: "GET" });
      const json = await res.json();
      setUpdateMessage(json?.message ?? "Done");
    } catch (err: any) {
      setUpdateMessage(err?.message || "Error");
    } finally {
      setShowUpdateModal(true);
    }
  };

  const handleKnowledgeSync = async () => {
    setIsKnowledgeSyncing(true);
    setUpdateTitle("Knowledge Sync");

    try {
      const res = await fetch(`${knowledgeBaseUrl}/product-knowledge/sync`, {
        method: "POST",
      });

      const contentType = res.headers.get("content-type") || "";
      let message = "";

      if (contentType.includes("application/json")) {
        const json = await res.json();
        message = json?.message ?? json?.data?.message ?? "";
      } else {
        message = (await res.text()).trim();
      }

      if (!res.ok) {
        throw new Error(message || `HTTP ${res.status}`);
      }

      setUpdateMessage(message || "Knowledge sync started successfully.");
    } catch (err: any) {
      setUpdateMessage(err?.message || "Failed to sync knowledge.");
    } finally {
      setIsKnowledgeSyncing(false);
      setShowUpdateModal(true);
    }
  };

  return (
    <SidebarContainer
      data-mobile-visible={mobileVisible ? "true" : "false"}
      customStyles={{
        overflow: "hidden",
      }}
    >
      <Header>
        <ImageWrapper>
          <MobileHeaderCopy>
            <MobileHeaderTitle>Chats</MobileHeaderTitle>
          </MobileHeaderCopy>
        </ImageWrapper>
        <Actions>
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
          <HeaderActionButton
            type="button"
            onClick={handleKnowledgeSync}
            disabled={isKnowledgeSyncing}
          >
            {isKnowledgeSyncing ? "Syncing..." : "Sync Knowledge"}
          </HeaderActionButton>
          <ThemeIconContainer onClick={handleChangeThemeMode}>
            {theme.mode === "light" ? <BsMoon /> : <BsFillMoonFill />}
          </ThemeIconContainer>
        </Actions>
      </Header>

      {/* <SidebarAlert /> */}
      <SearchArea>
        <div style={{ flex: 1 }}>
          <SearchField />
        </div>
        <div>
          <ToggleSearch />
        </div>
      </SearchArea>

      <ContactContainer id="scrollableDiv">
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
            {updateTitle}
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
