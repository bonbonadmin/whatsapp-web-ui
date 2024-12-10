import React, { useState } from "react";
import { useChatContext } from "../../context/chat"; // Adjust the import path
import Icon from "common/components/icons";
import { SearchWrapper, IconContainer, Input } from "./styles";

type SearchFieldProps = {
  placeholder?: string;
  [x: string]: any;
};

export default function SearchField(props: SearchFieldProps) {
  const { placeholder, ...rest } = props;
  const { onSearch } = useChatContext();
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // console.log("Input Change:", value);
    setInputValue(value);
    //onSearch(value); // Trigger search on input change
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // console.log("Search Submit:", inputValue);
    onSearch(inputValue); // Optionally, handle search on form submit
  };

  return (
    <SearchWrapper {...rest}>
      <IconContainer>
        <Icon id="search" className="search-icon" aria-hidden="true" />
        <button
          className="search__back-btn"
          onClick={() => {
            // Define what the back button should do
            // For example, clear search results or navigate back
            setInputValue("");
            onSearch("");
          }}
          aria-label="Go back"
        >
          <Icon id="back" aria-hidden="true" />
        </button>
      </IconContainer>
      <form onSubmit={handleSubmit} style={{ flex: 1 }}>
        <Input
          type="text"
          placeholder={placeholder ?? "Search or start a new chat"}
          value={inputValue}
          onChange={handleInputChange}
          aria-label="Search"
        />
      </form>
    </SearchWrapper>
  );
}
