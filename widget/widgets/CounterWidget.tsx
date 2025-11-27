/**
 * Counter Widget - Demonstrates tools/call API
 *
 * Features:
 * - Calls the "increment" tool via tools/call
 * - Shows tool input/result handling
 * - Theme-aware styling
 */

import { useState, useEffect } from "react";
import type { CallToolResult } from "../../shared/types";

interface CounterWidgetProps {
  isDark: boolean;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
  callTool: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
}

export function CounterWidget({ isDark, toolInput, toolResult, callTool }: CounterWidgetProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Initialize from tool input
  useEffect(() => {
    if (toolInput?.arguments?.count !== undefined) {
      const initialCount = toolInput.arguments.count as number;
      setCount(initialCount);
      setHistory((h) => [...h, `Initialized with count: ${initialCount}`]);
    }
  }, [toolInput]);

  // Update from tool result
  useEffect(() => {
    if (toolResult?.structuredContent?.count !== undefined) {
      setCount(toolResult.structuredContent.count as number);
    }
  }, [toolResult]);

  const handleIncrement = async (amount: number) => {
    setLoading(true);
    try {
      const result = await callTool("increment", { count, amount });
      if (result.structuredContent?.count !== undefined) {
        const newCount = result.structuredContent.count as number;
        setCount(newCount);
        setHistory((h) => [...h, `Incremented by ${amount} → ${newCount}`]);
      }
    } catch (err) {
      setHistory((h) => [...h, `Error: ${err instanceof Error ? err.message : "Unknown"}`]);
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    padding: "0.5rem 1rem",
    fontSize: "1rem",
    cursor: loading ? "wait" : "pointer",
    background: isDark ? "#333" : "#eee",
    color: isDark ? "#fff" : "#000",
    border: "1px solid",
    borderColor: isDark ? "#555" : "#ccc",
    borderRadius: "4px",
    marginRight: "0.5rem",
    opacity: loading ? 0.6 : 1,
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", opacity: 0.7 }}>
        tools/call Demo
      </h3>

      <div style={{ fontSize: "4rem", fontWeight: "bold", margin: "1rem 0" }}>
        {count}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => handleIncrement(1)} disabled={loading} style={buttonStyle}>
          +1
        </button>
        <button onClick={() => handleIncrement(5)} disabled={loading} style={buttonStyle}>
          +5
        </button>
        <button onClick={() => handleIncrement(10)} disabled={loading} style={buttonStyle}>
          +10
        </button>
        <button onClick={() => handleIncrement(-1)} disabled={loading} style={buttonStyle}>
          -1
        </button>
      </div>

      {history.length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.5rem",
            background: isDark ? "#222" : "#f5f5f5",
            borderRadius: "4px",
            fontSize: "0.75rem",
            maxHeight: "100px",
            overflow: "auto",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>History:</div>
          {history.slice(-5).map((entry, i) => (
            <div key={i} style={{ opacity: 0.8 }}>
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
