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
  const [submittedValue, setSubmittedValue] = useState("");
  const [searchMessages, setSearchMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const beforeRef = React.useRef<number | null>(null);
  const abortRef = React.useRef<AbortController>();
  const requestRef = React.useRef(0);
  const { activeChat } = useChatContext();
  const baseURL = process.env.REACT_APP_API_URL;
  const theme = useAppTheme();

  const fetchMessages = async (more = false) => {
    const term = (more ? submittedValue : searchValue).trim();
    if (!activeChat?.waId || !term || (more && loading)) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");
    if (!more) {
      setSearchMessages([]);
      setSubmittedValue(term);
      setHasMore(false);
    }
    try {
      const { data } = await axios.get(
        `${baseURL}/message-inbox/${encodeURIComponent(activeChat.participantId)}`,
        {
          params: {
            searchTerm: term,
            searchOnly: 1,
            limit: 50,
            days: -1,
            beforeId: more ? beforeRef.current : undefined,
          },
          headers: { "x-wa-id": activeChat.waId },
          signal: controller.signal,
          timeout: 20000,
        }
      );
      if (data.success === false) throw new Error(data.message);
      if (requestId !== requestRef.current) return;
      const next: Message[] = (data.data || [])
        .map((value: MessageResponse) => ({
          id: String(value.id),
          body: value.message_text || "",
          date: new Date(value.created_at).toLocaleDateString(),
          timestamp: new Date(value.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          messageStatus: value.message_status === 1 ? "READ" : "DELIVERED",
          isOpponent: value.from_me === 0,
          messageType: value.message_type,
          mediaLocation: value.media_location,
        }))
        .reverse();
      setSearchMessages((previous) => (more ? [...previous, ...next] : next));
      beforeRef.current = data.oldestId;
      setHasMore(!!data.hasMore);
    } catch (error) {
      if (!axios.isCancel(error) && requestId === requestRef.current)
        setError("Search failed. Please try again.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void fetchMessages();
  };

  // Render text as React nodes: punctuation stays literal and message HTML is never executed.
  const highlightText = (text: string, search: string) => {
    const index = text.toLocaleLowerCase().indexOf(search.toLocaleLowerCase());
    if (!search || index < 0) return text.slice(0, 140);
    const start = Math.max(0, index - 35);
    const end = Math.min(text.length, index + search.length + 90);
    return (
      <>
        {start > 0 ? "…" : ""}
        {text.slice(start, index)}
        <mark>{text.slice(index, index + search.length)}</mark>
        {text.slice(index + search.length, end)}
        {end < text.length ? "…" : ""}
      </>
    );
  };

  const handleResultClick = (message: Message) => onClickSearch(message.id);

  useEffect(() => {
    const requests = requestRef;
    requests.current++;
    abortRef.current?.abort();
    setSearchValue("");
    setSubmittedValue("");
    setSearchMessages([]);
    setError("");
    setLoading(false);
    setHasMore(false);
    return () => {
      requests.current++;
      abortRef.current?.abort();
    };
  }, [isSearchActive, activeChat?.participantId, activeChat?.waId]);

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
      {loading && <p role="status">Searching…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && submittedValue && !searchMessages.length && (
        <p>No matching messages</p>
      )}
      {searchMessages.length > 0 && (
        <div style={{ ...styles.resultsContainer, ...dynamicStyles.resultsContainer }}>
          {searchMessages.map((message) => (
            <div
              key={message.id}
              style={{ ...styles.resultItem, ...dynamicStyles.resultItem }}
              onClick={() => handleResultClick(message)}
            >
              <div>{highlightText(message.body, submittedValue)}</div>
              <div style={styles.resultMeta}>
                <span>{message.date}</span>
                <span>{message.timestamp}</span>
              </div>
            </div>
          ))}
          {hasMore && (
            <button disabled={loading} onClick={() => fetchMessages(true)}>
              Load more results
            </button>
          )}
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
