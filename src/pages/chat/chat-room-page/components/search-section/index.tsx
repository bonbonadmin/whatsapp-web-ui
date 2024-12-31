import Icon from "common/components/icons";
import React, { useState, CSSProperties, useEffect } from "react";
import { Message, MessageResponse } from "../messages-list/data/get-messages";
import axios from "axios";
import { useChatContext } from "pages/chat/context/chat";
import { useAppTheme } from "common/theme";

interface SearchSectionProps {
  isSearchActive: boolean;
  onClickSearch: (id: string) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ isSearchActive, onClickSearch }) => {
  const [searchValue, setSearchValue] = useState("");
  const [searchMessages, setSearchMessages] = useState<Message[]>([]);
  const { activeChat } = useChatContext();
  const baseURL = process.env.REACT_APP_API_URL;
  const theme = useAppTheme();

  const fetchMessages = async () => {
    try {
      const params: any = { searchTerm: searchValue };
      const response = await axios.get(`${baseURL}/message-inbox/${activeChat?.participantId}`, {
        params,
      });
      const newMessages: Message[] = [];

      if (response.data.data?.length) {
        response.data.data.forEach((value: MessageResponse) => {
          const timeStamp =
            new Date().toDateString() === new Date(value.created_at).toDateString()
              ? new Date(value.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : new Date(value.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                });

          const data: Message = {
            id: value.id,
            body: value.message_text,
            date: new Date(value.created_at).toLocaleDateString(),
            timestamp: timeStamp,
            messageStatus: value.message_status === 1 ? "READ" : "DELIVERED",
            isOpponent: value.from_me === 0 ? true : false,
            messageType: value.message_type,
            mediaLocation: value.media_location,
          };
          newMessages.push(data);
        });
      }

      setSearchMessages(newMessages);
    } catch (error) {
      console.error("Error fetching messages list:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log("Search triggered with value:", searchValue);
      if (searchValue !== "") {
        fetchMessages();
      }
    }
  };

  const highlightText = (text: string, search: string) => {
    if (!search) return text;

    const regex = new RegExp(`(${search})`, "gi");
    const match = text.match(regex);

    if (match) {
      const index = text.indexOf(match[0]);

      let start = Math.max(0, index - 30);
      let end = Math.min(text.length, index + match[0].length + 70);

      let snippet = text.substring(start, end);

      if (snippet.length > 100) {
        if (start > 0) {
          snippet = `...${snippet.substring(snippet.indexOf(match[0]), snippet.length)}`;
        }
        if (end < text.length) {
          snippet = `${snippet.substring(0, 97)}...`;
        }
      }

      snippet = snippet.replace(regex, `<mark>$1</mark>`);

      return snippet;
    }

    return text.length > 100 ? `${text.substring(0, 97)}...` : text;
  };

  const handleResultClick = (message: Message) => {
    console.log("Clicked message:", message);
    onClickSearch(message.id);
  };

  useEffect(() => {
    if (!isSearchActive) {
      setSearchValue("");
      setSearchMessages([]);
    }
  }, [isSearchActive]);

  const dynamicStyles = {
    container: {
      backgroundColor: theme.mode === "dark" ? "#2C2C2C" : "#F5F5F5",
      border: theme.mode === "dark" ? "1px solid #444" : "1px solid #CCC",
    },
    resultsContainer: {
      backgroundColor: theme.mode === "dark" ? "#1E1E1E" : "#FFF",
      border: theme.mode === "dark" ? "1px solid #444" : "1px solid #DDD",
    },
    resultItem: {
      color: theme.mode === "dark" ? "#FFF" : "#000",
      backgroundColor: theme.mode === "dark" ? "#2C2C2C" : "#F9F9F9",
    },
    input: {
      color: theme.mode === "dark" ? "#FFF" : "#000",
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={{ ...styles.container, ...dynamicStyles.container }}>
        <div style={styles.iconContainer}>
          <Icon id="search" aria-hidden="true" style={styles.searchIcon} />
        </div>
        <input
          type="text"
          placeholder="Search messages ..."
          value={searchValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          style={{ ...styles.input, ...dynamicStyles.input }}
        />
      </div>
      {searchMessages.length > 0 && (
        <div style={{ ...styles.resultsContainer, ...dynamicStyles.resultsContainer }}>
          {searchMessages.map((message) => (
            <div
              key={message.id}
              style={{ ...styles.resultItem, ...dynamicStyles.resultItem }}
              onClick={() => handleResultClick(message)}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: highlightText(message.body, searchValue),
                }}
              />
              <div style={styles.resultMeta}>
                <span>{message.date}</span>
                <span>{message.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  wrapper: {
    padding: "12px",
  },
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    padding: "8px",
    marginBottom: "16px",
  },
  iconContainer: {
    marginRight: "8px",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    fontSize: "16px",
  },
  input: {
    border: "none",
    outline: "none",
    fontSize: "14px",
    width: "100%",
  },
  resultsContainer: {
    borderRadius: "8px",
    overflowY: "auto",
    padding: "8px",
    height: "755px",
    overflowX: "hidden",
    scrollbarWidth: "none", // For Firefox
    msOverflowStyle: "none", // For IE and Edge
  },
  resultItem: {
    padding: "8px",
    marginBottom: "4px",
    cursor: "pointer",
    fontSize: "12px",
    lineHeight: "1.4",
  },
  resultMeta: {
    fontSize: "12px",
    marginTop: "4px",
    display: "flex",
    justifyContent: "space-between",
  },
};

export default SearchSection;
