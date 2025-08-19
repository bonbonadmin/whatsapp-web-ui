import Icon from "common/components/icons";
import {
  AboutItem,
  ActionSection,
  ActionText,
  Avatar,
  AvatarWrapper,
  Heading,
  HeadingWrapper,
  MediaButton,
  MediaImage,
  MediaImagesWrapper,
  PersonalInfo,
  ProfileName,
  Section,
  Wrapper,
} from "./styles";

type ProfileSectionProps = {
  name: string;
  image: string;
  phoneNumber: string;
  events?: { event_name: string; started_at: string }[];
};

function formatEventDate(iso?: string) {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

export default function ProfileSection(props: ProfileSectionProps) {
  const { name, image, phoneNumber, events  } = props;

  // console.log("Test", phoneNumber);

  return (
    <Wrapper>
      <PersonalInfo>
        {/* <AvatarWrapper>
          <Avatar src={image} alt="User Profile" />
        </AvatarWrapper> */}
        <ProfileName>{name}</ProfileName>
      </PersonalInfo>

      {/* <Section>
        <HeadingWrapper>
          <Heading>Media, Links and Documents</Heading>
          <MediaButton>
            <Icon id="rightArrow" className="icon" />
          </MediaButton>
        </HeadingWrapper>
        <MediaImagesWrapper>
          <MediaImage src="/assets/images/placeholder.jpeg" alt="Media" />
          <MediaImage src="/assets/images/placeholder.jpeg" alt="Media" />
          <MediaImage src="/assets/images/placeholder.jpeg" alt="Media" />
        </MediaImagesWrapper>
      </Section> */}

      <Section>
        {/* <HeadingWrapper>
          <Heading>About and phone number</Heading>
        </HeadingWrapper> */}
        <ul>
          {/* <AboutItem>
            Everyone should learn how to program because it teaches you how to think.
          </AboutItem> */}
          <AboutItem>{phoneNumber}</AboutItem>
        </ul>
      </Section>

      <Section>
        <ul>
            {events?.length
            ? events.map((e, i) => (
              <AboutItem key={`${e.event_name}-${e.started_at}-${i}`}>
                {e.event_name} — {formatEventDate(e.started_at)}
              </AboutItem>
            ))
            : null}
        </ul>

      </Section>

      {/* <ActionSection>
        <Icon id="block" className="icon" />
        <ActionText>Block</ActionText>
      </ActionSection> */}
      <ActionSection>
        <Icon id="thumbsDown" className="icon" />
        <ActionText>Load all chats</ActionText>
      </ActionSection>
      {/* <ActionSection>
        <Icon id="delete" className="icon" />
        <ActionText>Delete chat</ActionText>
      </ActionSection> */}
    </Wrapper>
  );
}
