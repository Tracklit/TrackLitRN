import { createRoot } from "react-dom/client";

function TestApp() {
  return (
    <div style={{ padding: '20px', color: 'white', background: 'red', minHeight: '100vh' }}>
      <h1>REACT IS WORKING!</h1>
      <p>Minimal test successful</p>
    </div>
  );
}

try {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(<TestApp />);
    console.log("React render successful");
  } else {
    console.error("Root element not found");
    document.body.innerHTML = "<h1>ROOT ELEMENT MISSING</h1>";
  }
} catch (error) {
  console.error("React render error:", error);
  document.body.innerHTML = "<h1>REACT ERROR: " + error.message + "</h1>";
}
