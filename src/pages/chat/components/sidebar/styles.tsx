import styled from "styled-components";

export const SidebarContainer = styled.aside<{ customStyles?: React.CSSProperties }>`
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

  @media screen and (max-width: 767px) {
    display: flex;
    min-width: 100%;
    width: 100%;
    flex: 1 1 100%;
    border-right: none;
    background:
      linear-gradient(180deg, rgba(19, 28, 36, 0.98), rgba(17, 27, 33, 1));

    &[data-mobile-visible="false"] {
      display: none;
    }
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

  @media screen and (max-width: 767px) {
    min-height: 88px;
    padding: 18px 16px 10px;
    align-items: flex-end;
    background: rgba(20, 28, 35, 0.92);
    backdrop-filter: blur(14px);
  }
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

  @media screen and (max-width: 767px) {
    margin-right: 0;

    & > * {
      margin-left: 14px;
    }
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
  min-height: 0;
  overflow-y: auto;
  background: ${(props) => props.theme.common.secondaryColor};
  border-top: 1px solid ${(props) => props.theme.common.borderColor};

  @media screen and (max-width: 767px) {
    border-top: none;
    background: transparent;
    padding-bottom: calc(env(safe-area-inset-bottom) + 16px);
  }
`;

export const Loader = styled.p`
  text-align: center;
  color: ${(props) => props.theme.common.subHeadingColor};
  font-size: 1rem;
  margin: 20px 0;
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const EndMessage = styled.p`
  text-align: center;
  color: ${(props) => props.theme.common.subHeadingColor};
  font-size: 0.9rem;
  margin: 20px 0;
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
