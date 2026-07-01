import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BudgetDataProvider } from "./BudgetDataContext.jsx";
import { loadBudgetData } from "./loadBudgetData.js";
import "./index.css";

function Root() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBudgetData()
      .then(setData)
      .catch((err) => setError(String(err.message || err)));
  }, []);

  if (error) {
    return (
      <p style={{ padding: "2rem", fontFamily: "system-ui", color: "#B53227" }}>
        Could not load budget data. {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div
        id="root-loading"
        style={{ padding: "clamp(24px,5vw,48px)", fontSize: 14, color: "var(--sub)" }}
      >
        Loading Dallas budget…
      </div>
    );
  }

  return (
    <BudgetDataProvider data={data}>
      <App />
    </BudgetDataProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
