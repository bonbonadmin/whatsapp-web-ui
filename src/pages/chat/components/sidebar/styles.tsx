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
    background: linear-gradient(180deg, rgba(19, 28, 36, 0.98), rgba(17, 27, 33, 1));

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
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px 14px;
  min-height: 96px;

  @media screen and (max-width: 767px) {
    min-height: 108px;
    padding: calc(env(safe-area-inset-top) + 16px) 16px 14px;
    align-items: stretch;
    background: rgba(20, 28, 35, 0.92);
    backdrop-filter: blur(14px);
  }
`;

export const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: wrap;

  & > * {
    flex: 0 0 auto;
  }

  @media screen and (max-width: 767px) {
    gap: 2px;
  }
`;

export const HeaderTitle = styled.h1`
  color: ${(props) => props.theme.common.mainHeadingColor};
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
  letter-spacing: 0.01em;
`;

export const HeaderActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition: background 140ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

export const ThemeIconContainer = styled(HeaderActionButton)`
  svg {
    width: 20px;
    height: 20px;
    fill: ${(props) => props.theme.common.headerIconColor};
  }
`;

export const QueueIconContainer = styled(HeaderActionButton)`
  svg {
    width: 20px;
    height: 20px;
    fill: ${(props) => props.theme.common.headerIconColor};
  }
`;

export const QueueModalShell = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(1180px, calc(100vw - 32px));
  height: min(760px, calc(100dvh - 32px));
  background: ${(props) => props.theme.unselectedChat.bg};
  border: 1px solid ${(props) => props.theme.common.borderColor};
  border-radius: 8px;
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.38);
  outline: none;
  overflow: hidden;

  @media screen and (max-width: 767px) {
    width: 100vw;
    height: 100dvh;
    border-radius: 0;
    border: none;
  }
`;

export const WaSelectorRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

export const LineSelectWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  width: min(100%, 310px);
`;

export const LineSelect = styled.select<{ $mode: "light" | "dark" }>`
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 100%;
  padding: 8px 36px 8px 12px;
  border-radius: 10px;
  border: 1px solid
    ${({ $mode }) => ($mode === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)")};
  background: ${({ $mode }) =>
    $mode === "light" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.06)"};
  color: ${({ $mode }) => ($mode === "light" ? "#1f2937" : "#e5e7eb")};
  outline: none;
  transition: box-shadow 140ms ease, border-color 140ms ease, background 140ms ease;

  &:hover {
    border-color: ${({ $mode }) =>
      $mode === "light" ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.38)"};
  }

  &:focus {
    box-shadow: 0 0 0 3px
      ${({ $mode }) => ($mode === "light" ? "rgba(59,130,246,0.35)" : "rgba(96,165,250,0.35)")};
    border-color: ${({ $mode }) =>
      $mode === "light" ? "rgba(59,130,246,0.9)" : "rgba(96,165,250,0.9)"};
  }

  & > option {
    background: ${({ $mode }) => ($mode === "light" ? "#ffffff" : "#1f2937")};
    color: ${({ $mode }) => ($mode === "light" ? "#111827" : "#e5e7eb")};
  }
`;

export const Caret = styled.span<{ $mode: "light" | "dark" }>`
  pointer-events: none;
  position: absolute;
  right: 10px;
  top: 50%;
  width: 16px;
  height: 16px;
  transform: translateY(-50%);
  display: inline-block;

  background-image: ${({ $mode }) =>
    `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none' stroke='${encodeURIComponent(
      $mode === "light" ? "#374151" : "#d1d5db"
    )}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 8 10 12 14 8'/></svg>")`};
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.9;
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
