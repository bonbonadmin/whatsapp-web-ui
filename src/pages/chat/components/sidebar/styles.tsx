import styled from "styled-components";

/**
 * On desktop: regular column.
 * On mobile (<768px): left drawer that slides over content.
 * Controlled by the "$isOpen" prop.
 */
export const SidebarContainer = styled.aside<{
  $isOpen?: boolean;
  customStyles?: React.CSSProperties;
}>`
  min-width: 300px;
  flex: 0 0 360px;
  border-right: 1px solid ${(props) => props.theme.common.borderColor};
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.layout.bg};
  ${(props) => props.customStyles && { ...props.customStyles }}

  @media screen and (min-width: 1301px) {
    flex-basis: 30%;

    & ~ div {
      flex: 70%;
    }
  }

  @media screen and (min-width: 1000px) and (max-width: 1300px) {
    flex-basis: 35%;

    & ~ div {
      flex: 65%;
    }
  }

  @media screen and (min-width: 768px) and (max-width: 999px) {
    flex-basis: 40%;

    & ~ div {
      flex: 60%;
    }
  }

  /* Mobile drawer behavior */
  @media screen and (max-width: 767px) {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: min(420px, 92vw);
    max-width: 92vw;
    transform: translateX(${(p) => (p.$isOpen ? "0" : "-100%")});
    transition: transform 0.25s ease;
    z-index: 1000; /* above chat content */
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
  }

  .icon {
    color: ${(props) => props.theme.common.headerIconColor};
  }
`;

export const Header = styled.header`
  background: ${(props) => props.theme.common.primaryColor};
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 10px;
  min-height: 60px;
`;

export const ImageWrapper = styled.div`
  width: 40px;
  height: 40px;
`;

export const Avatar = styled.img`
  border-radius: 50%;
  height: 100%;
  width: 100%;
  object-fit: cover;
`;

export const Actions = styled.div`
  margin-right: 20px;

  & > * {
    display: inline-block;
    margin-left: 25px;
    cursor: pointer;
    background: none;
    border: none;
  }
`;

export const ThemeIconContainer = styled.div`
  svg {
    margin-bottom: 2px;
    width: 20px;
    height: 20px;
    fill: ${(props) => props.theme.common.headerIconColor};
  }
`;

export const ContactContainer = styled.div`
  flex: 1;
  min-height: 0; /* critical for nested scroll on mobile */
  overflow-y: auto;
  background: ${(props) => props.theme.common.secondaryColor};
  border-top: 1px solid ${(props) => props.theme.common.borderColor};
`;

export const Loader = styled.p`
  text-align: center;
  color: ${(props) => props.theme.common.subHeadingColor};
  font-size: 1rem;
  margin: 20px 0;
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export const EndMessage = styled.p`
  text-align: center;
  color: ${(props) => props.theme.common.subHeadingColor};
  font-size: 0.9rem;
  margin: 20px 0;
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

/** Dark overlay behind the drawer on mobile */
export const DrawerOverlay = styled.div<{ $isOpen?: boolean }>`
  display: none;

  @media (max-width: 767px) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.28);
    opacity: ${(p) => (p.$isOpen ? 1 : 0)};
    pointer-events: ${(p) => (p.$isOpen ? "auto" : "none")};
    transition: opacity 0.2s ease;
    z-index: 999;
  }
`;

/** Small FAB to open the drawer on mobile */
export const OpenInboxFab = styled.button`
  display: none;

  @media (max-width: 767px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    left: calc(12px + env(safe-area-inset-left));
    bottom: calc(env(safe-area-inset-bottom) + var(--composer-h, 72px) + 250px);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${(p) => p.theme.common.secondaryColor};
    color: ${(p) => p.theme.common.subHeadingColor};
    box-shadow: 0 6px 20px rgba(0,0,0,.2);
    z-index: 50;
    border: none;
    cursor: pointer;
  }
`;