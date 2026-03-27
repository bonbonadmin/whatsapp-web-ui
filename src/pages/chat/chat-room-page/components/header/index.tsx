import Icon from "common/components/icons";
import OptionsMenu from "pages/chat/components/option-menu";
import { useNavigate } from "react-router-dom";
import {
  Action,
  Actions,
  actionStyles,
  Avatar,
  AvatarWrapper,
  BackButton,
  Container,
  Name,
  ProfileWrapper,
  Subtitle,
} from "./styles";

type HeaderProps = {
  onSearchClick: Function;
  onProfileClick: Function;
  title: string;
  image: string;
  subTitle: string;
};

export default function Header(props: HeaderProps) {
  const navigate = useNavigate();
  const { title, subTitle, image, onProfileClick, onSearchClick } = props;

  return (
    <Container>
      <BackButton aria-label="Back to chats" onClick={() => navigate("/")}>
        <Icon id="back" className="icon" />
      </BackButton>
      {/* <AvatarWrapper>
        <Avatar src={image} />
      </AvatarWrapper> */}
      <ProfileWrapper onClick={onProfileClick}>
        <Name>{title}</Name>
        {subTitle && <Subtitle>{subTitle}</Subtitle>}
      </ProfileWrapper>
      <Actions>
        <Action onClick={onSearchClick}>
          <Icon id="search" className="icon search-icon" />
        </Action>
        {/* <OptionsMenu
          styles={actionStyles}
          ariaLabel="Menu"
          iconId="menu"
          iconClassName="icon"
          options={[
            "Contact Info",
            "Select Messages",
            "Mute notifications",
            "Clear messages",
            "Delete chat",
          ]}
        /> */}
      </Actions>
    </Container>
  );
}
