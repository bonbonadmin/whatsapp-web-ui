import styled from "styled-components";

export const App = styled.div`
  width: 100%;
  min-height: 100vh;
  background: ${(props) => props.theme.layout.bg};
  position: relative;

  &::before {
    width: 100%;
    /* height: 120px; */
    top: 0;
    left: 0;
    position: absolute;
    content: "";
    z-index: 1;
  }

  @media screen and (min-width: 1450px) {
    padding: 20px;
  }
`;

export const Message = styled.p`
  display: none;
`;

export const Content = styled.div`
  width: 100%;
  height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom);
  padding-top: env(safe-area-inset-top);
  max-width: 1450px;
  margin: 0 auto;
  box-shadow: ${(props) => props.theme.layout.contentBoxShadowColor};
  position: relative;
  z-index: 100;
  display: flex;
  overflow-y: hidden;
  overflow-x: hidden;

  @media screen and (max-width: 1050px) {
    height: 100dvh;
  }

  @media screen and (max-width: 767px) {
    max-width: 100%;
    height: 100dvh;
    background:
      linear-gradient(180deg, rgba(11, 20, 26, 0.82), rgba(11, 20, 26, 0.98)),
      ${(props) => props.theme.layout.bg};
    box-shadow: none;
    border-radius: 0;
  }
`;

export const MobilePane = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;

  @media screen and (max-width: 767px) {
    width: 100%;
    min-width: 100%;
    height: 100%;

    &[data-mobile-visible="false"] {
      display: none;
    }
  }
`;
