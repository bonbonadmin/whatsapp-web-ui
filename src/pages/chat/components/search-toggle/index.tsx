import { useChatContext } from "pages/chat/context/chat";
import React, { useState, CSSProperties, useEffect } from "react";

const localStyles: Record<string, CSSProperties> = {
  toggleButton: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%", // Circular shape
    width: "28px", // Smaller width
    height: "28px", // Smaller height
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    border: "1px solid #ccc",
  },
  active: {
    backgroundColor: "#E0E0E0",
  },
  inactive: {
    backgroundColor: "transparent",
  },
  lineContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "8px", // Reduced height
    width: "12px", // Reduced width
  },
  line: {
    height: "1.5px", // Thinner lines
    backgroundColor: "#666", // Line color
    width: "100%",
    borderRadius: "1px",
    transition: "background-color 0.3s ease",
  },
};

export default function ToggleButton() {
  const { onToggleSearch, isFetchInbox } = useChatContext();
  const [isActive, setIsActive] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const toggleButton = () => {
    const toggle: boolean = !isActive;
    setIsActive(toggle);
    onToggleSearch(toggle);
  };

  useEffect(() => {
    setIsDisabled(isFetchInbox);
  }, [isFetchInbox]);

  return (
    <div
      style={{
        ...localStyles.toggleButton,
        ...(isActive ? localStyles.active : localStyles.inactive),
        ...(isDisabled && { backgroundColor: "#e0e0e0", cursor: "not-allowed" }),
      }}
      onClick={!isDisabled ? toggleButton : undefined}
      aria-label="Toggle Menu"
      aria-disabled={isDisabled} // Accessibility attribute
    >
      <div style={localStyles.lineContainer}>
        <div
          style={{
            ...localStyles.line,
            backgroundColor: isActive ? "#3FDAA8" : "#666",
            opacity: isDisabled ? 0.5 : 1, // Dull the lines if disabled
          }}
        ></div>
        <div
          style={{
            ...localStyles.line,
            backgroundColor: isActive ? "#3FDAA8" : "#666",
            opacity: isDisabled ? 0.5 : 1,
          }}
        ></div>
        <div
          style={{
            ...localStyles.line,
            backgroundColor: isActive ? "#3FDAA8" : "#666",
            opacity: isDisabled ? 0.5 : 1,
          }}
        ></div>
      </div>
    </div>
  );
}
