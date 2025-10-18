import styled, { css } from "styled-components";

export const Wrapper = styled.aside.attrs({ 'data-profile-panel': '' })`
  /* Parent controls width via CSS vars; no extra flex/width here */
  background: ${(p) => p.theme.common.primaryColor};
  height: 100dvh;
  position: sticky;
  top: 0;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom);

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: static;
    overflow: visible;
  }
`;

export const profileSectionStyles = css`
  background: ${(p) => p.theme.common.secondaryColor};
  margin-bottom: 10px;
  box-shadow: ${(p) => p.theme.chatRoom.profileBoxShadow};
  padding: 10px 20px;
`;

export const PersonalInfo = styled.div`
  ${profileSectionStyles}
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
`;

export const AvatarWrapper = styled.div`
  width: clamp(120px, 40%, 200px);
  height: clamp(120px, 40%, 200px);
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Avatar = styled.img`
  border-radius: 50%;
  height: 100%;
  width: 100%;
  object-fit: cover;
`;

export const ProfileName = styled.h2`
  flex: 1;
  color: ${(p) => p.theme.common.mainHeadingColor};
  font-size: 1.2rem;
  align-self: center;
`;

export const Section = styled.div`
  ${profileSectionStyles}
`;

export const HeadingWrapper = styled.div`
  margin-top: 5px;
  margin-bottom: 10px;
  display: flex; align-items: center; justify-content: space-between;
`;

export const Heading = styled.h2`
  color: ${(p) => p.theme.chatRoom.profileHeadingColor};
  font-size: 0.85rem; flex: 1;
`;

export const MediaButton = styled.button`
  .icon { color: ${(p) => p.theme.common.subHeadingColor}; }
`;

export const MediaImagesWrapper = styled.div`
  display: flex; align-items: center; justify-content: space-between;
`;

export const MediaImage = styled.img`
  width: 32%;
`;

export const AboutItem = styled.li`
  display: flex; align-items: center; justify-content: space-between;
  padding: 15px 0; margin-bottom: 5px; cursor: pointer;
  font-weight: 500; color: ${(p) => p.theme.common.subHeadingColor};
  &:not(:last-of-type) { border-bottom: 1px solid ${(p) => p.theme.common.primaryColor}; }
`;

export const ActionSection = styled(Section)`
  color: ${(p) => p.theme.chatRoom.profileActionColor};
  display: flex; align-items: center;
  padding-top: 20px; padding-bottom: 20px; cursor: pointer;
  .icon { margin-right: 20px; }
`;

export const ActionText = styled.p`
  flex: 1;
`;