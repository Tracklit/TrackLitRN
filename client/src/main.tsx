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
  try {
    root.render(React.createElement(App));
    console.log("6. App component rendered successfully");
  } catch (appError) {
    console.error("=== ERROR RENDERING APP COMPONENT ===", appError);
    throw appError;
  }
  
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

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
