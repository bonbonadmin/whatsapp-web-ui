import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  align-items: stretch;
  position: relative;
  width: 100%;
  height: 100dvh;
  gap: 16px;

  /* let chat column shrink; we'll protect the profile */
  & > * { min-width: 0; }

  /* ---- OPEN: hard minimum for the profile ---- */
  &[data-profile='open'] > [data-profile-panel] {
    --profile-min: 360px;            /* <= set your minimum here */
    --profile-max: 480px;
    --profile-w: clamp(var(--profile-min), 28vw, var(--profile-max));
  }

  /* profile flex sizing + inline override for overlay-style sidebars */
  & > [data-profile-panel] {
    box-sizing: border-box;
    flex: 0 0 var(--profile-w, 360px);
    width: var(--profile-w, 360px);
    min-width: var(--profile-min, 360px);
    max-width: var(--profile-max, 480px);
    flex-shrink: 0;

    /* If the child is an overlay, convert it to inline while nested here */
    & > * {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      max-width: none !important;
      height: 100%;
      transform: none !important;
      box-shadow: none; /* optional: keep flat when inline */
    }

    transition:
      flex-basis 0.25s ease,
      width 0.25s ease,
      min-width 0.25s ease,
      max-width 0.25s ease,
      transform 0.25s ease,
      opacity 0.2s ease;
    will-change: width, transform;
  }

  /* ---- CLOSED: collapse smoothly ---- */
  &[data-profile='closed'] { gap: 0; }
  &[data-profile='closed'] > [data-profile-panel] {
    flex-basis: 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    max-width: 0 !important;
    transform: translateX(8px);
    opacity: 0;
    pointer-events: none;
    overflow: hidden;
  }

  /* Mobile: stack and make sidebar full-width when open */
  @media (max-width: 768px) {
    flex-wrap: wrap;

    &[data-profile='open'] > [data-profile-panel] {
      --profile-min: 100%;
      --profile-max: 100%;
      --profile-w: 100%;
    }
    &[data-profile='closed'] > [data-profile-panel] { display: none; }
  }
`;

export const Body = styled.div`
  min-width: 0;
  flex: 1 1 auto;
  display: grid;
  grid-template-rows: auto 1fr auto;
  position: relative;
  z-index: 1;
  min-height: 0;
`;

export const Background = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.05;
  z-index: 0;
  background: url("/assets/images/bg-chat-room.png") ${(p) => p.theme.chatRoom.bg};
  pointer-events: none;
`;

export const FooterContainer = styled.div`
  background: ${(p) => p.theme.common.primaryColor};
  position: sticky;
  bottom: 0;
  z-index: 5;
  padding-bottom: env(safe-area-inset-bottom);
`;

export const ScrollButton = styled.button`
  position: fixed;
  right: calc(16px + env(safe-area-inset-right));
  bottom: calc(env(safe-area-inset-bottom) + var(--composer-h, 72px) + 12px);
  inline-size: 44px; block-size: 44px; width: 44px; height: 44px;
  padding: 0; border: 0; border-radius: 9999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: ${(p) => p.theme.common.secondaryColor};
  color: ${(p) => p.theme.common.subHeadingColor};
  box-shadow: ${(p) => p.theme.chatRoom.scrollBtnBoxShadow};
  contain: paint; isolation: isolate;
  -webkit-tap-highlight-color: transparent; cursor: pointer; z-index: 60;

  @media (min-width: 768px) { bottom: 80px; }
  html[data-kb='1'] &, html[data-drawer='1'] & { opacity: 0; pointer-events: none; }
`;