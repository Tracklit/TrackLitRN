import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("=== MAIN.TSX STARTING ===");

try {
  console.log("1. Finding root element");
  const rootElement = document.getElementById("root");
  console.log("2. Root element found:", rootElement);
  
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  console.log("3. Creating React root");
  const root = createRoot(rootElement);
  console.log("4. React root created successfully");
  
  console.log("5. Rendering App component");
  root.render(React.createElement(App));
  console.log("6. App component rendered successfully");
  
} catch (error) {
  console.error("=== ERROR IN MAIN.TSX ===", error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  document.body.innerHTML = `
    <div style="padding: 20px; background: red; color: white; font-family: monospace;">
      <h1>React Loading Error</h1>
      <p>Error: ${errorMessage}</p>
      <p>Check browser console for details</p>
    </div>
  `;
}
