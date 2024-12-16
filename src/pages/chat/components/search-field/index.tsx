import React, { CSSProperties, useState } from "react";
import { useChatContext } from "../../context/chat"; // Adjust the import path
import Icon from "common/components/icons";

type SearchFieldProps = {
  placeholder?: string;
  [x: string]: any;
};

const localStyles: Record<string, React.CSSProperties> = {
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#1e1e1e", // Search bar background
    borderRadius: "8px",
    padding: "8px 12px",
    margin: "10px", // Space on all sides
    // width: "calc(100% - 32px)", // Adjust width to account for margins
    maxWidth: "600px",
    boxSizing: "border-box",
  },
  parentContainer: {
    backgroundColor: "#121212", // Match the background color of the section below
  },
  iconContainer: {
    marginRight: "8px",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    color: "#8b8b8b",
    fontSize: "16px",
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#ffffff",
  },
};

export default function SearchField(props: SearchFieldProps) {
  const { placeholder, ...rest } = props;
  const { onSearch, searchText } = useChatContext();
  const [inputValue, setInputValue] = useState(searchText);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  return (
    <div style={localStyles.parentContainer}>
      <form onSubmit={handleSubmit} style={localStyles.searchWrapper} {...rest}>
        <div style={localStyles.iconContainer}>
          <Icon id="search" aria-hidden="true" style={localStyles.searchIcon} />
        </div>
        <input
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
