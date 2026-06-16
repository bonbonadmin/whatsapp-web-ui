import styled, { css } from "styled-components";

export const Wrapper = styled.div`
  /* should be refactor to one wrapper. using multiple places */
  padding: 10px;
  height: 60px;
  position: relative;
  display: flex;
  align-items: center;
  /* should be refactor to one wrapper. using multiple places */

  @media screen and (max-width: 767px) {
    padding: 8px 10px;
    height: auto;
    min-height: 64px;
    gap: 8px;
  }
`;

export const ReplyTargetBar = styled.div`
  align-items: center;
  background: ${(props) => props.theme.common.secondaryColor};
  border-left: 3px solid #25d366;
  color: ${(props) => props.theme.common.mainHeadingColor};
  display: flex;
  gap: 10px;
  margin: 0 10px;
  padding: 7px 10px;
`;

export const ReplyTargetText = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ReplyTargetAuthor = styled.div`
  color: #128c7e;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 16px;
`;

export const ReplyTargetBody = styled.div`
  color: ${(props) => props.theme.common.subHeadingColor};
  font-size: 0.78rem;
  line-height: 17px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ClearReplyButton = styled.button`
  color: ${(props) => props.theme.common.subHeadingColor};
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 3px 6px;
`;

export const iconCommonStyles = css`
  color: ${(props) => props.theme.common.subHeadingColor};
`;

export const IconsWrapper = styled.div`
  position: relative;
`;

export const AttachButton = styled.button`
  margin-left: 10px;

  .icon {
    ${iconCommonStyles}
  }

  @media screen and (max-width: 767px) {
    margin-left: 0;
  }
`;

export const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 50px;
`;

export const Button = styled.button<{ readonly showIcon: boolean }>`
  transform: ${(props) => (props.showIcon ? "scale(1)" : "scale(0)")};
  opacity: ${(props) => (props.showIcon ? 1 : 0)};
  transition: all 0.5s ease;
  margin-bottom: 10px;

  &:nth-of-type(1) {
    transition-delay: 0.25s;
  }

  &:nth-of-type(2) {
    transition-delay: 0.2s;
  }

  &:nth-of-type(3) {
    transition-delay: 0.15s;
  }

  &:nth-of-type(4) {
    transition-delay: 0.1s;
  }

  &:nth-of-type(5) {
    transition-delay: 0.05s;
  }
`;

export const Input = styled.input`
  /* background: white; */
  /* color: rgb(74, 74, 74); */
  background: ${(props) => props.theme.common.secondaryColor};
  color: ${(props) => props.theme.common.subHeadingColor};

  padding: 20px 10px;
  border-radius: 10px;
  flex: 1;
  height: 100%;
  margin-left: 7px;

  /* &::placeholder {
  color: rgb(153, 153, 153);
} */

  &::placeholder {
    /* color: rgb(74, 74, 74); */
    color: ${(props) => props.theme.common.subHeadingColor};
    font-size: 0.9rem;
  }

  &:focus {
    outline: none;
  }
`;

export const TextArea = styled.textarea`
  /* background: white; */
  /* color: rgb(74, 74, 74); */
  background: ${(props) => props.theme.common.secondaryColor};
  color: ${(props) => props.theme.common.subHeadingColor};

  padding: 10px;
  border-radius: 10px;
  flex: 1;
  height: 100%;
  margin-left: 7px;

  resize: none; /* Disable the resize handle */

  /* &::placeholder {
  color: rgb(153, 153, 153);
} */

  &::placeholder {
    /* color: rgb(74, 74, 74); */
    color: ${(props) => props.theme.common.subHeadingColor};
    font-size: 0.9rem;
  }

  &:focus {
    outline: none;
  }

  @media screen and (max-width: 767px) {
    min-height: 42px;
    max-height: 110px;
    padding: 10px 12px;
    margin-left: 0;
    font-size: 0.92rem;
    border-radius: 22px;
  }
`;

export const ControlsWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;

  @media screen and (max-width: 767px) {
    margin-left: 0;
    gap: 2px;
  }
`;

export const SendMessageButton = styled.button`
  .icon {
    margin-left: 8px;
    margin-right: 8px;
    width: 28px;
    height: 28px;
    padding: 3px;
    border-radius: 50%;
    ${iconCommonStyles}
  }

  @media screen and (max-width: 767px) {
    .icon {
      width: 24px;
      height: 24px;
      margin-left: 4px;
      margin-right: 4px;
    }
  }
`;
