import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import GlobalProvider from "@/components/GlobalProvider";
import { ConfirmationDialogProvider } from "@/contexts/ConfirmationDialogContext";
import { Toaster } from "react-hot-toast";
import { ConfigProvider } from "antd";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#16a34a",
            },
          }}
        >
          <GlobalProvider>
            <ConfirmationDialogProvider>
              <Toaster position="top-right" />
              <App />
            </ConfirmationDialogProvider>
          </GlobalProvider>
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
