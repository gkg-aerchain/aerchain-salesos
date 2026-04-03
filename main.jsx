import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App
      moduleFilter={["pricing-calculator", "pricing-calculator-v2", "proposal-generator", "design-extractor", "doc-formatter", "training", "settings"]}
      appName="Aerchain · SalesOS"
    />
  </StrictMode>
);
