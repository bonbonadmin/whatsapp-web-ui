import { useLocation } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { App, Content, MobilePane } from "./styles";

export default function ChatLayout(props: { children: any }) {
  const location = useLocation();
  const isChatRoute = location.pathname !== "/";

  return (
    <App>
      <Content data-mobile-view={isChatRoute ? "chat" : "inbox"}>
        <Sidebar mobileVisible={!isChatRoute} />
        <MobilePane data-mobile-visible={isChatRoute ? "true" : "false"}>
          {props.children}
        </MobilePane>
      </Content>
    </App>
  );
}
