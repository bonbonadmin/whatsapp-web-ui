import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  position: relative;
  width: 100%;
  height: 100dvh; /* dynamic viewport to avoid iOS URL bar jump */
`;

export const Body = styled.div`
  min-width: 0;
  flex: 1 1 auto;
  display: grid;
  grid-template-rows: auto 1fr auto; /* Header | Messages | Footer */
  position: relative;
  z-index: 1;
  /* allow nested scroll containers to actually scroll */
  min-height: 0;
`;

export const Background = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.05;
  z-index: 0;
  background: url("/assets/images/bg-chat-room.png") ${(props) => props.theme.chatRoom.bg};
  pointer-events: none;
`;

export const FooterContainer = styled.div`
  background: ${(props) => props.theme.common.primaryColor};
  position: sticky;
  bottom: 0;
  z-index: 5;
  padding-bottom: env(safe-area-inset-bottom);
`;

/**
 * Scroll-to-bottom FAB
 * - Sticky keeps it above the composer on mobile
 * - Works inside the scrolling messages container
 */
export const ScrollButton = styled.button`
  /* FLOATING, NOT STICKY */
  position: fixed;
  right: calc(16px + env(safe-area-inset-right));
  bottom: calc(env(safe-area-inset-bottom) + var(--composer-h, 72px) + 12px);

  /* exact size, no surprises */
  inline-size: 44px;            /* logical width */
  block-size: 44px;             /* logical height */
  width: 44px;                  /* for older engines */
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 9999px;

  /* only the circle is painted */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.theme.common.secondaryColor};
  color: ${(p) => p.theme.common.subHeadingColor};
  box-shadow: ${(p) => p.theme.chatRoom.scrollBtnBoxShadow};

  /* prevent “row-wide” paint in Safari/iOS */
  contain: paint;
  isolation: isolate;

  /* mobile niceties */
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  z-index: 60; /* above chat, below drawers (999/1000) */

  /* if you want it to tuck lower on tablet/desktop */
  @media (min-width: 768px) {
    bottom: 80px;
  }

  /* OPTIONAL: auto-hide when keyboard up or drawer open */
  html[data-kb='1'] &,
  html[data-drawer='1'] & {
    opacity: 0;
    pointer-events: none;
  }
`;