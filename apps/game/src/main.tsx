import React from "react";
import ReactDOM from "react-dom/client";
import RootLayout from "./app/layout";
import PhaserGamePage from "./app/page";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootLayout>
      <PhaserGamePage />
    </RootLayout>
  </React.StrictMode>
);
