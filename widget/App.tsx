import { useState, useEffect } from "react";
import { useApp } from "./hooks/useApp";

export function App() {
  const { isConnected, hostContext, toolInput, toolResult, callServerTool } = useApp();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize count from tool input
  useEffect(() => {
    if (toolInput?.arguments?.count !== undefined) {
      setCount(toolInput.arguments.count as number);
    }
  }, [toolInput]);

  // Update count from tool result
  useEffect(() => {
    if (toolResult?.structuredContent?.count !== undefined) {
      setCount(toolResult.structuredContent.count as number);
    }
  }, [toolResult]);

  const handleIncrement = async () => {
    setLoading(true);
    try {
      const result = await callServerTool("increment", { count, amount: 1 });
      if (result.structuredContent?.count !== undefined) {
        setCount(result.structuredContent.count as number);
      }
    } finally {
      setLoading(false);
    }
  };

  const theme = hostContext?.theme ?? "light";
  const isDark = theme === "dark";

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "1rem",
        background: isDark ? "#1a1a1a" : "#fff",
        color: isDark ? "#fff" : "#000",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ margin: "0 0 1rem" }}>Counter Widget</h2>

      {!isConnected ? (
        <p>Connecting...</p>
      ) : (
        <>
          <div style={{ fontSize: "3rem", fontWeight: "bold", margin: "1rem 0" }}>{count}</div>

          <button
            onClick={handleIncrement}
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1rem",
              cursor: loading ? "wait" : "pointer",
              background: isDark ? "#333" : "#eee",
              color: isDark ? "#fff" : "#000",
              border: "1px solid",
              borderColor: isDark ? "#555" : "#ccc",
              borderRadius: "4px",
            }}
          >
            {loading ? "..." : "+1"}
          </button>

          <div style={{ marginTop: "1rem", fontSize: "0.8rem", opacity: 0.6 }}>
            Theme: {theme} | Mode: {hostContext?.displayMode ?? "unknown"}
          </div>
        </>
      )}
    </div>
  );
}
