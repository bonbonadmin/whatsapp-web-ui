import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";
import GlobalStyle from "global-styles";
import AppThemeProvider from "common/theme";
import { MainPageLoader } from "common/components/loader";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <AppThemeProvider>
    <GlobalStyle />
    <BrowserRouter>
      <React.Suspense fallback={<MainPageLoader />}>
        <App />
      </React.Suspense>
    </BrowserRouter>
  </AppThemeProvider>
);
