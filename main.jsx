import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App
      moduleFilter={["pricing-calculator", "proposal-generator"]}
      appName="Aerchain · SalesOS"
    />
  </StrictMode>
);
