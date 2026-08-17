import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import App from "./App";
import registerServiceWorker from "./serviceWorker";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// appka na plochu a offline provoz – v dev režimu se nic neregistruje
registerServiceWorker();
