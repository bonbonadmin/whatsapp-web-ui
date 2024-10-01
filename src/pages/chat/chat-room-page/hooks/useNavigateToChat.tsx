import { Inbox } from "common/types/common.type";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * If no chat inbox selected, need to navigate to chat page,
 * maybe user reload the page
 */
export default function useNavigateToChat(activeInbox?: Inbox) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeInbox) {
      navigate("/");
    }
  }, [activeInbox, navigate]);
}
