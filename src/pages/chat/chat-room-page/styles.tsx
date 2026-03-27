import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;

  @media screen and (max-width: 767px) {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
`;

export const Body = styled.div`
  min-width: 300px;
  flex: 40%;
  border-right: 1px solid ${(props) => props.theme.common.borderColor};
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  min-height: 0;

  @media screen and (max-width: 767px) {
    min-width: 0;
    width: 100%;
    flex: 1 1 auto;
    border-right: none;
  }
`;

export const Background = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  opacity: 0.05;
  z-index: 1;
  background: url("/assets/images/bg-chat-room.png") ${(props) => props.theme.chatRoom.bg};
`;

export const FooterContainer = styled.div`
  background: ${(props) => props.theme.common.primaryColor};
  position: relative;
  z-index: 100;

  @media screen and (max-width: 767px) {
    padding-bottom: env(safe-area-inset-bottom);
    background: rgba(20, 28, 35, 0.92);
    backdrop-filter: blur(14px);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
`;

export const ScrollButton = styled.button`
  position: absolute;
  right: 15px;
  bottom: 80px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: ${(props) => props.theme.common.subHeadingColor};
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${(props) => props.theme.common.secondaryColor};
  box-shadow: ${(props) => props.theme.chatRoom.scrollBtnBoxShadow};
  z-index: 10;

  @media screen and (max-width: 767px) {
    right: 12px;
    bottom: 88px;
    width: 38px;
    height: 38px;
  }
`;
