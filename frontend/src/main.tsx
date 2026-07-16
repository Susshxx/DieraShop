import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prefetchProducts } from "@/lib/productCache";

// Prefetch products immediately for instant page loads
prefetchProducts();

createRoot(document.getElementById("root")!).render(<App />);
