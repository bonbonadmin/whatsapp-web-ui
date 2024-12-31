import ChatLayout from "../layouts";
import Header from "./components/header";
import Footer from "./components/footer";
import Sidebar from "./components/sidebar";
import Icon from "common/components/icons";
import useChatRoom from "./hooks/useChatRoom";
import ProfileSection from "./components/profile";
import MessagesList from "./components/messages-list";
import SearchSection from "./components/search-section";
import useNavigateToChat from "./hooks/useNavigateToChat";
import { Container, Body, Background, FooterContainer, ScrollButton } from "./styles";
import { useChatContext } from "../context/chat";
import { useEffect, useState } from "react";
import React from "react";

export default function ChatRoomPage() {
  const {
    activeInbox,
    handleMenuOpen,
    handleShowIcon,
    isProfileOpen,
    isSearchOpen,
    isShowIcon,
    setIsProfileOpen,
    setIsSearchOpen,
    setShouldScrollToBottom,
    shouldScrollToBottom,
    participantMessages,
  } = useChatRoom();
  useNavigateToChat(activeInbox);

  const scrollButton = React.useRef<HTMLButtonElement>(null);

  const chatCtx = useChatContext();
  useEffect(() => {
    setShouldScrollToBottom(true);
  }, []);
  // useEffect(() => {
  //   if (chatCtx.firstOpenChat) {
  //     scrollButton.current?.click();
  //     setShouldScrollToBottom(true);
  //     // chatCtx.onFirstOpenChat(false);
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [chatCtx.firstOpenChat])

  const [selectedSearchId, setSelectedSearchId] = useState<string>('');

  const handleClickSearch = (id: string) => {
    setSelectedSearchId(id)
  }

  useEffect(() => {
    if (!isSearchOpen) {
      setSelectedSearchId('')
    }
  }, [isSearchOpen])

  return (
    <ChatLayout>
      <Container>
        <Body>
          <Background />
          <Header
            title={activeInbox?.name ?? ""}
            image={activeInbox?.image ?? ""}
            subTitle={activeInbox?.isOnline ? "Online" : ""}
            onSearchClick={() => handleMenuOpen("search")}
            onProfileClick={() => handleMenuOpen("profile")}
          />
          <MessagesList
            onShowBottomIcon={handleShowIcon}
            shouldScrollToBottom={shouldScrollToBottom}
            listMessages={participantMessages}
            testToBottom={chatCtx.firstOpenChat}
            isSearchOpen={isSearchOpen}
            selectedSearchId={selectedSearchId}
          />
          <FooterContainer>
            {isShowIcon && (
              <ScrollButton ref={scrollButton} onClick={() => setShouldScrollToBottom(true)}>
                <Icon id="downArrow" />
              </ScrollButton>
            )}
            <Footer />
          </FooterContainer>
        </Body>
        <Sidebar title="Search" isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}>
          <SearchSection onClickSearch={handleClickSearch} isSearchActive={isSearchOpen} />
        </Sidebar>
        <Sidebar
          title="Contact Info"
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        >
          <ProfileSection name={activeInbox?.name ?? ""} image={activeInbox?.image ?? ""} phoneNumber={activeInbox?.participantId ?? ""} />
        </Sidebar>
      </Container>
    </ChatLayout>
  );
}
