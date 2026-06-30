import ChatLayout from "pages/chat/layouts";
import { useChatContext } from "pages/chat/context/chat";
import { Inbox } from "common/types/common.type";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import OpenAIQueuePanel from "./panel";

export default function OpenAIQueuePage() {
  const chatCtx = useChatContext();
  const navigate = useNavigate();

  const openParticipant = useCallback(
    (participantId: string) => {
      const id = participantId.trim();
      if (!id) return;

      const chat =
        chatCtx.inbox.find((item) => item.participantId === id) ??
        ({
          id,
          participantId: id,
          name: id,
          image: "/assets/images/boy4.jpeg",
          updatedAt: "",
        } as Inbox);

      chatCtx.onChangeChat(chat);
      chatCtx.onFirstOpenChat(true);

      const selectedWaId = localStorage.getItem("wa:selectedId") || "";
      const q = selectedWaId ? `?waId=${encodeURIComponent(selectedWaId)}` : "";
      navigate("/" + id + q);
    },
    [chatCtx, navigate]
  );

  return (
    <ChatLayout>
      <OpenAIQueuePanel onParticipantClick={openParticipant} />
    </ChatLayout>
  );
}
