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
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Header(props: HeaderProps) {
  const navigate = useNavigate();
  const { title, subTitle, image, onProfileClick, onSearchClick } = props;
  const { manualState, isTogglingManual, onToggleManual } = useChatContext();

  // Only offer the toggle when this participant + line actually has a thread.
  const showManual = !!manualState?.hasThread;
  const isManual = !!manualState?.manual;

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
        {showManual && (
          <ManualToggle
            type="button"
            $active={isManual}
            disabled={isTogglingManual}
            title={manualTitle}
            aria-pressed={isManual}
            onClick={() => onToggleManual(!isManual)}
          >
            <ManualSwitch $active={isManual} />
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
