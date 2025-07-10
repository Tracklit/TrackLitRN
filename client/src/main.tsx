import { createRoot } from "react-dom/client";
import AuthenticatedApp from "./AuthenticatedApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(<AuthenticatedApp />);
