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
  ManualSwitch,
  ManualToggle,
  Name,
  ProfileWrapper,
  Subtitle,
} from "./styles";
import { useChatContext } from "pages/chat/context/chat";

type HeaderProps = {
  onSearchClick: Function;
  onProfileClick: Function;
  title: string;
  image: string;
  subTitle: string;
};

const formatManualTime = (iso: string | null) => {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function Header(props: HeaderProps) {
  const navigate = useNavigate();
  const { title, subTitle, image, onProfileClick, onSearchClick } = props;
  const { manualState, isTogglingManual, onToggleManual } = useChatContext();
  const isManual = Boolean(manualState?.manual);
  const showManualToggle = Boolean(manualState?.hasThread);
  const manualTitle = isManual
    ? `Manual on since ${formatManualTime(manualState?.timeManual ?? null)}` +
      (manualState?.manualExpiresAt
        ? ` — auto-off at ${formatManualTime(manualState.manualExpiresAt)}`
        : "")
    : "AI is handling this chat. Turn on manual to take over.";

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
        {showManualToggle && (
          <ManualToggle
            type="button"
            $active={isManual}
            disabled={isTogglingManual}
            title={manualTitle}
            aria-label={isManual ? "Turn off manual mode" : "Turn on manual mode"}
            aria-pressed={isManual}
            onClick={() => onToggleManual(!isManual)}
          >
            <ManualSwitch $active={isManual} aria-hidden="true" />
            <span>{isManual ? "Manual" : "Auto"}</span>
          </ManualToggle>
        )}
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
