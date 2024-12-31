import React, { CSSProperties, useEffect, useState } from "react";
import { useChatContext } from "../../context/chat"; // Adjust the import path
import Icon from "common/components/icons";
import { useAppTheme } from "common/theme";

type SearchFieldProps = {
  placeholder?: string;
  [x: string]: any;
};

export default function SearchField(props: SearchFieldProps) {
  const { placeholder, ...rest } = props;
  const { onSearch, searchText, isFetchInbox } = useChatContext();
  const [inputValue, setInputValue] = useState(searchText);
  const [isDisabled, setIsDisabled] = useState(false);
  const theme = useAppTheme();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  useEffect(() => {
    setIsDisabled(isFetchInbox);
  }, [isFetchInbox]);

  // Dynamic Styles Based on Theme
  const localStyles: Record<string, React.CSSProperties> = {
    searchWrapper: {
      display: "flex",
      alignItems: "center",
      backgroundColor: theme.mode === "dark" ? "#1e1e1e" : "#f0f0f0",
      borderRadius: "8px",
      padding: "8px 12px",
      margin: "10px",
      maxWidth: "600px",
      boxSizing: "border-box",
      border: `1px solid ${theme.mode === "dark" ? "#444" : "#ccc"}`,
    },
    parentContainer: {
      // backgroundColor: theme.mode === "dark" ? "#121212" : "#ffffff",
    },
    iconContainer: {
      marginRight: "8px",
      display: "flex",
      alignItems: "center",
    },
    searchIcon: {
      color: theme.mode === "dark" ? "#8b8b8b" : "#666666",
      fontSize: "16px",
    },
    searchInput: {
      flex: 1,
      background: "transparent",
      border: "none",
      outline: "none",
      fontSize: "14px",
      color: theme.mode === "dark" ? "#ffffff" : "#000000",
    },
  };

  return (
    <div style={localStyles.parentContainer}>
      <form onSubmit={handleSubmit} style={localStyles.searchWrapper} {...rest}>
        <div style={localStyles.iconContainer}>
          <Icon id="search" aria-hidden="true" style={localStyles.searchIcon} />
        </div>
        <input
          disabled={isDisabled}
          type="text"
          placeholder={placeholder ?? "Search"}
          value={inputValue}
          onChange={handleInputChange}
          style={localStyles.searchInput}
          aria-label="Search"
        />
      </form>
    </div>
  );
}
