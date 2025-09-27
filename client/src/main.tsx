import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("=== MAIN.TSX STARTING v2 ===");

// Add immediate loading fallback to prevent white page
document.body.style.margin = "0";
document.body.style.padding = "0";
const loadingDiv = document.createElement("div");
loadingDiv.id = "initial-loading";
loadingDiv.innerHTML = `
  <div style="
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #0f172a;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: system-ui, -apple-system, sans-serif;
  ">
    <div style="
      width: 32px;
      height: 32px;
      border: 3px solid #f1c40f;
      border-top: 3px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    "></div>
    <p style="
      color: #94a3b8;
      margin: 0;
      font-size: 14px;
    ">Loading TrackLit...</p>
  </div>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
`;
document.body.appendChild(loadingDiv);

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
  
  // Remove the loading screen once React is ready
  setTimeout(() => {
    const loadingElement = document.getElementById("initial-loading");
    if (loadingElement) {
      loadingElement.remove();
      console.log("7. Initial loading screen removed");
    }
  }, 200);
  
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
