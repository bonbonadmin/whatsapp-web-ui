// /pages/chat/components/sidebar/index.tsx
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
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

export default function Sidebar() {
  const theme = useAppTheme();
  const navigate = useNavigate();
  const chatCtx = useChatContext();

  const handleChangeThemeMode = () => {
    theme.onChangeThemeMode();
  };

  const handleChangeChat = (chat: Inbox) => {
    chatCtx.onChangeChat(chat);
    chatCtx.onFirstOpenChat(true);
    navigate("/" + chat.participantId);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
  };

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const baseUrl = process.env.REACT_APP_API_URL;

  // ---------------------------------------------------------------------------
  // Pin overlay (no need for chatCtx.setInbox)
  // ---------------------------------------------------------------------------
  // Overlay state keyed by participantId to provide optimistic UI for pin/unpin
  const [pinOverlay, setPinOverlay] = useState<
    Record<string, { isPinned: boolean; pinnedAt: string | null }>
  >({});

  // Merge server data with overlay (icon + local sort will reflect instantly)
  const mergedInbox: Inbox[] = useMemo(() => {
    return chatCtx.inbox.map((x) => {
      const o = pinOverlay[x.participantId];
      return o ? { ...x, isPinned: o.isPinned, pinnedAt: o.pinnedAt } : x;
    });
  }, [chatCtx.inbox, pinOverlay]);

  // Cosmetic sort: pinned first, then recent pinnedAt, then recent timestamp
  const sortedInbox: Inbox[] = useMemo(() => {
    const toTime = (v?: string | null) => (v ? Date.parse(v) || 0 : 0);
    const arr = [...mergedInbox];
    arr.sort((a, b) => {
      const ap = a.isPinned ? 1 : 0;
      const bp = b.isPinned ? 1 : 0;
      if (ap !== bp) return bp - ap;

      const apin = toTime(a.pinnedAt);
      const bpin = toTime(b.pinnedAt);
      if (apin !== bpin) return bpin - apin;

      const at = toTime(a.timestamp);
      const bt = toTime(b.timestamp);
      return bt - at;
    });
    return arr;
  }, [mergedInbox]);

  // Optimistic toggle + rollback using only overlay state
  const togglePin = async (participantId: string, next: boolean) => {
    const now = new Date().toISOString();

    // optimistic overlay
    setPinOverlay((prev) => ({
      ...prev,
      [participantId]: { isPinned: next, pinnedAt: next ? now : null },
    }));

    try {
      const res = await fetch(`${baseUrl}/message-inbox/${participantId}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // reconcile with server values
      setPinOverlay((prev) => ({
        ...prev,
        [participantId]: {
          isPinned: !!json?.data?.is_pinned,
          pinnedAt: json?.data?.pinned_at ?? null,
        },
      }));
    } catch (_e) {
      // rollback
      setPinOverlay((prev) => ({
        ...prev,
        [participantId]: { isPinned: !next, pinnedAt: !next ? now : null },
      }));
    }
  };

  const handleTemplateUpdate = async () => {
    try {
      const res = await fetch(`${baseUrl}/template-update`, { method: "GET" });
      const json = await res.json();
      setUpdateMessage(json.message ?? "Done");
    } catch (err: any) {
      setUpdateMessage(err.message || "Error");
    } finally {
      setShowUpdateModal(true);
    }
  };

  return (
    <SidebarContainer
      customStyles={{
        overflow: "hidden",
      }}
    >
      <Header>
        <ImageWrapper>{/* <Avatar src="/assets/images/profile.png" /> */}</ImageWrapper>
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
          <ThemeIconContainer onClick={handleChangeThemeMode}>
            {theme.mode === "light" ? <BsMoon /> : <BsFillMoonFill />}
          </ThemeIconContainer>
          {/* <button aria-label="Status">
            <Icon id="status" className="icon" />
          </button>
          <button aria-label="New chat">
            <Icon id="chat" className="icon" />
          </button>
          <OptionsMenu
            iconClassName="icon"
            className="icon"
            ariaLabel="Menu"
            iconId="menu"
            options={[
              "New group",
              "Create a room",
              "Profile",
              "Archived",
              "Starred",
              "Settings",
              "Log out",
            ]}
          /> */}
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