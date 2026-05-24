import React from "react";
import { Routes, Route } from "react-router-dom";
import ChatProvider from "pages/chat/context/chat";
import ProtectedRoute from "components/ProtectedRoute";

const ChatPage = React.lazy(() => import("pages/chat/chat-room-page"));
const UnSelectedChatPage = React.lazy(() => import("pages/chat/unselected-page"));
const LoginPage = React.lazy(() => import("pages/login"));
const OpenAIQueuePage = React.lazy(() => import("pages/openai-queue"));

export default function AppRoutes() {
  return (
    <ChatProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/openai-queue" element={<ProtectedRoute Component={OpenAIQueuePage} />} />
        <Route path="/:id" element={<ProtectedRoute Component={ChatPage} />} />
        <Route path="/" element={<ProtectedRoute Component={UnSelectedChatPage} />} />
      </Routes>
    </ChatProvider>
  );
}
