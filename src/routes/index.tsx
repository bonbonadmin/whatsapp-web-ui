import React from "react";
import { Routes, Route } from "react-router-dom";
import ChatProvider from "pages/chat/context/chat";
import ProtectedRoute from "components/ProtectedRoute";

const ChatPage = React.lazy(() => import("pages/chat/chat-room-page"));
const UnSelectedChatPage = React.lazy(() => import("pages/chat/unselected-page"));
const LoginPage = React.lazy(() => import("pages/login"));

export default function AppRoutes() {
  return (
    <ChatProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/:id"
          element={<ProtectedRoute Component={ChatPage} />}
        />
        <Route
          path="/"
          element={<ProtectedRoute Component={UnSelectedChatPage} />}
        />
      </Routes>
    </ChatProvider>
  );
}
