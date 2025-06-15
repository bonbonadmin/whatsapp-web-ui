import { useNavigate } from "react-router-dom";
import { useState } from "react";
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

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const baseUrl = process.env.REACT_APP_API_URL;

  const handleTemplateUpdate = async () => {
    try {
      const res = await fetch(`${baseUrl}/template-update`, { method: "GET" });
      const json = await res.json();
      // assume your API returns { success: boolean, message: string }
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
        overflow: 'hidden'
      }}
    >
      <Header>
        <ImageWrapper>{/* <Avatar src="/assets/images/profile.png" /> */}</ImageWrapper>
        <Actions>
          <button
            aria-label="Update Templates"
            onClick={handleTemplateUpdate}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon id="singleTick" className="icon" />
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
          dataLength={chatCtx.inbox.length}
          next={chatCtx.loadMore}
          hasMore={chatCtx.hasMore}
          loader={<Loader>Loading..</Loader>}
          endMessage={<EndMessage>No more chats</EndMessage>}
          scrollableTarget="scrollableDiv"
        >
          {chatCtx.inbox.map((inbox) => (
            <InboxContact
              key={inbox.id}
              inbox={inbox}
              isActive={inbox.id === chatCtx.activeChat?.id}
              onChangeChat={handleChangeChat}
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
