import styled from "styled-components";

export const Page = styled.div<{ $embedded?: boolean }>`
  width: 100%;
  min-width: 0;
  height: 100%;
  background: ${(props) => props.theme.unselectedChat.bg};
  color: ${(props) => props.theme.common.mainHeadingColor};
  display: flex;
  flex-direction: column;
  border-bottom: ${(props) =>
    props.$embedded ? "none" : `6px solid ${props.theme.common.tertiaryColor}`};
  border-radius: ${(props) => (props.$embedded ? "8px" : "0")};
  overflow: hidden;
`;

export const Header = styled.header<{ $embedded?: boolean }>`
  flex: 0 0 auto;
  padding: ${(props) => (props.$embedded ? "18px 20px 14px" : "24px 28px 18px")};
  background: ${(props) => props.theme.common.primaryColor};
  border-bottom: 1px solid ${(props) => props.theme.common.borderColor};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;

  @media screen and (max-width: 767px) {
    padding: calc(env(safe-area-inset-top) + 18px) 16px 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

export const TitleGroup = styled.div`
  min-width: 0;
`;

export const Title = styled.h1`
  font-size: 1.35rem;
  line-height: 1.2;
  font-weight: 600;
  color: ${(props) => props.theme.common.mainHeadingColor};
`;

export const Subtitle = styled.p`
  margin-top: 6px;
  font-size: 0.9rem;
  line-height: 1.45;
  color: ${(props) => props.theme.common.subHeadingColor};
`;

export const HeaderActions = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;

  @media screen and (max-width: 767px) {
    justify-content: flex-start;
  }
`;

export const Body = styled.section<{ $embedded?: boolean }>`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: ${(props) => (props.$embedded ? "14px 20px 20px" : "18px 28px 28px")};
  gap: 14px;
  overflow: hidden;

  @media screen and (max-width: 767px) {
    padding: 14px 12px calc(env(safe-area-inset-bottom) + 18px);
  }
`;

export const Toolbar = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;

  @media screen and (max-width: 900px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const FilterForm = styled.form`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
`;

export const Input = styled.input`
  height: 38px;
  width: 180px;
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.common.borderColor};
  background: ${(props) => props.theme.common.secondaryColor};
  color: ${(props) => props.theme.common.mainHeadingColor};
  padding: 0 12px;
  outline: none;
  font-size: 0.9rem;

  &::placeholder {
    color: ${(props) => props.theme.common.subHeadingColor};
  }

  &:focus {
    border-color: ${(props) => props.theme.common.tertiaryColor};
    box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.18);
  }

  @media screen and (max-width: 480px) {
    width: 100%;
  }
`;

export const CountText = styled.p`
  color: ${(props) => props.theme.common.subHeadingColor};
  font-size: 0.86rem;
  white-space: nowrap;
`;

export const Button = styled.button<{ $variant?: "primary" | "quiet" }>`
  min-height: 38px;
  border-radius: 8px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${(props) =>
    props.$variant === "primary" ? "#ffffff" : props.theme.common.mainHeadingColor};
  background: ${(props) =>
    props.$variant === "primary"
      ? props.theme.common.tertiaryColor
      : props.theme.common.secondaryColor};
  border: 1px solid
    ${(props) =>
      props.$variant === "primary"
        ? props.theme.common.tertiaryColor
        : props.theme.common.borderColor};
  transition: opacity 140ms ease, transform 140ms ease, border-color 140ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: ${(props) => props.theme.common.tertiaryColor};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }
`;

export const TableShell = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid ${(props) => props.theme.common.borderColor};
  background: ${(props) => props.theme.common.secondaryColor};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1120px;
`;

export const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  background: ${(props) => props.theme.common.primaryColor};
  color: ${(props) => props.theme.common.subHeadingColor};
  border-bottom: 1px solid ${(props) => props.theme.common.borderColor};
  padding: 11px 12px;
  text-align: left;
  font-size: 0.76rem;
  line-height: 1.2;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const Td = styled.td`
  border-bottom: 1px solid ${(props) => props.theme.common.borderColor};
  padding: 12px;
  color: ${(props) => props.theme.common.mainHeadingColor};
  font-size: 0.86rem;
  line-height: 1.35;
  vertical-align: top;
`;

export const TextCell = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 320px;
  color: ${(props) => props.theme.common.mainHeadingColor};
`;

export const Muted = styled.span`
  color: ${(props) => props.theme.common.subHeadingColor};
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 999px;
  padding: 2px 9px;
  background: ${(props) => props.theme.badge.bgColor};
  color: ${(props) => props.theme.badge.textColor};
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
`;

export const Message = styled.div<{ $tone?: "error" | "empty" }>`
  flex: 0 0 auto;
  border: 1px solid
    ${(props) =>
      props.$tone === "error"
        ? props.theme.common.failedIconColor
        : props.theme.common.borderColor};
  background: ${(props) =>
    props.$tone === "error" ? "rgba(223, 51, 51, 0.1)" : props.theme.common.secondaryColor};
  color: ${(props) =>
    props.$tone === "error"
      ? props.theme.common.failedIconColor
      : props.theme.common.subHeadingColor};
  padding: 13px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
`;

export const CenterState = styled.div`
  flex: 1;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.common.subHeadingColor};
  font-size: 0.95rem;
  text-align: center;
  border: 1px solid ${(props) => props.theme.common.borderColor};
  background: ${(props) => props.theme.common.secondaryColor};
`;
