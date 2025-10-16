import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Safe rendering with error handling
function renderApp() {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Failed to find the root element. Check your index.html file.");
    return;
  }
  
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    console.error("Failed to render the application:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #333;">
        <h2>Application Error</h2>
        <p>Failed to start the application. Please check the console for more details.</p>
      </div>
    `;
  }
}

// Wait for the DOM to be fully loaded before rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}