import styled, { css } from "styled-components";

// export const Container = styled.aside<{ readonly isOpen: boolean }>`
//   width: 0;
//   min-width: 0;
//   display: flex;
//   flex-direction: column;
//   transition: all 0.1s ease;
//   overflow-x: hidden;
//   overflow-y: auto;
//   ${(props) =>
//     props.isOpen &&
//     css`
//       flex: 20%;
//     `}

//   @media screen and (max-width: 1000px) {
//     transition: transform 0.1s ease;
//     transform: translateX(120vw);
//     position: absolute;
//     left: 0;
//     width: 100%;
//     height: 100%;
//     z-index: 10;
//   }
// `;
export const Container = styled.aside<{ readonly isOpen: boolean }>`
  width: ${(props) => (props.isOpen ? "20%" : "0")};
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto;
  background: ${(props) => props.theme.common.secondaryColor};

  @media screen and (max-width: 1024px) {
    position: absolute;
    left: 0;
    width: ${(props) => (props.isOpen ? "80%" : "0")};
    height: 100%;
    z-index: 10;
    transition: width 0.3s ease;
  }

  @media screen and (max-width: 767px) {
    position: fixed;
    inset: 0;
    width: ${(props) => (props.isOpen ? "100%" : "0")};
    max-width: 100%;
    z-index: 1000;
    background: ${(props) => props.theme.common.secondaryColor};
  }
`;

export const Header = styled.header`
  background: ${(props) => props.theme.common.primaryColor};
  display: flex;
  align-items: flex-end;
  height: 104px;
  padding: 12px 16px 14px;
  min-height: 104px;

  @media screen and (max-width: 767px) {
    padding-top: calc(12px + env(safe-area-inset-top));
    min-height: 112px;
  }
`;

export const CloseButton = styled.button<{ onClick: any }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;

  .icon {
    color: ${(props) => props.theme.common.subHeadingColor};
  }
`;

export const Heading = styled.h2`
  flex: 1;
  color: ${(props) => props.theme.common.mainHeadingColor};
  font-size: 1rem;
  margin-bottom: 2px;
`;

export const Content = styled.div`
  flex: 1;
`;
