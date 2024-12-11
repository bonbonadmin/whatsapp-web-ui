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
  ImageWrapper,
  Loader,
  SidebarContainer,
  ThemeIconContainer,
} from "./styles";

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

  return (
    <SidebarContainer>
      <Header>
        <ImageWrapper>
          {/* <Avatar src="/assets/images/profile.png" /> */}
        </ImageWrapper>
        <Actions>
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
      <SearchField />
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
    </SidebarContainer>
  );
}
