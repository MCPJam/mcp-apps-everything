/**
 * MCP Apps Everything - Demo App
 *
 * Auto-detects and renders the appropriate widget based on tool result.
 * Each tool includes a `_widget` field in structuredContent to identify itself.
 *
 * Showcases all SEP-1865 APIs:
 * - tools/call: Counter Widget
 * - ui/open-link: Weather Widget
 * - resources/read: Notes Widget
 * - ui/message: Chat Widget
 */

import { useEffect } from "react";
import { useApp } from "./hooks/useApp";
import { CounterWidget } from "./widgets/CounterWidget";
import { WeatherWidget } from "./widgets/WeatherWidget";
import { NotesWidget } from "./widgets/NotesWidget";
import { ChatWidget } from "./widgets/ChatWidget";

type WidgetType = "counter" | "weather" | "notes" | "chat" | null;

const widgetInfo: Record<string, { api: string; description: string }> = {
  counter: { api: "tools/call", description: "Call MCP tools from the widget" },
  weather: { api: "ui/open-link", description: "Open external URLs" },
  notes: { api: "resources/read", description: "Read MCP resources" },
  chat: { api: "ui/message", description: "Send messages to chat" },
};

export function App() {
  const {
    isConnected,
    hostContext,
    toolInput,
    toolResult,
    callTool,
    readResource,
    sendMessage,
    openLink,
    resize,
  } = useApp();

  const theme = hostContext?.theme ?? "light";
  const isDark = theme === "dark";

  // Detect widget type from structuredContent._widget
  const widgetType: WidgetType =
    (toolResult?.structuredContent?._widget as WidgetType) || null;

  // Notify host of resize on mount
  useEffect(() => {
    resize(400, 450);
  }, [resize]);

  // Loading state
  if (!isConnected) {
    return (
      <div
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          background: isDark ? "#1a1a1a" : "#fff",
          color: isDark ? "#fff" : "#000",
          minHeight: "100vh",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <div>Connecting to host...</div>
      </div>
    );
  }

  // No widget detected - show help
  if (!widgetType) {
    return (
      <div
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
          background: isDark ? "#1a1a1a" : "#fff",
          color: isDark ? "#fff" : "#000",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem" }}>MCP Apps Demo</h2>
        <p style={{ opacity: 0.7, marginBottom: "1.5rem" }}>
          Waiting for tool result...
        </p>
        <div
          style={{
            background: isDark ? "#222" : "#f5f5f5",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
            Available Tools:
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.5rem", lineHeight: 1.8 }}>
            <li>
              <code>show-counter</code> - tools/call demo
            </li>
            <li>
              <code>show-weather</code> - ui/open-link demo
            </li>
            <li>
              <code>show-notes</code> - resources/read demo
            </li>
            <li>
              <code>show-chat</code> - ui/message demo
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const info = widgetInfo[widgetType];

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
      {/* Header with API info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          paddingBottom: "0.75rem",
          borderBottom: `1px solid ${isDark ? "#333" : "#ddd"}`,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", textTransform: "capitalize" }}>
            {widgetType} Widget
          </h2>
          <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem" }}>
            {info?.description}
          </div>
        </div>
        <div
          style={{
            background: isDark ? "#2563eb" : "#3b82f6",
            color: "#fff",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontFamily: "monospace",
          }}
        >
          {info?.api}
        </div>
      </div>

      {/* Widget Content */}
      <div style={{ minHeight: "280px" }}>
        {widgetType === "counter" && (
          <CounterWidget
            isDark={isDark}
            toolInput={toolInput}
            toolResult={toolResult}
            callTool={callTool}
          />
        )}
        {widgetType === "weather" && (
          <WeatherWidget
            isDark={isDark}
            toolInput={toolInput}
            toolResult={toolResult}
            openLink={openLink}
          />
        )}
        {widgetType === "notes" && (
          <NotesWidget
            isDark={isDark}
            toolInput={toolInput}
            readResource={readResource}
            callTool={callTool}
          />
        )}
        {widgetType === "chat" && (
          <ChatWidget isDark={isDark} sendMessage={sendMessage} />
        )}
      </div>

      {/* Footer with theme info */}
      <div
        style={{
          marginTop: "1rem",
          paddingTop: "0.75rem",
          borderTop: `1px solid ${isDark ? "#333" : "#ddd"}`,
          fontSize: "0.7rem",
          opacity: 0.5,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Theme: {theme}</span>
        <span>Mode: {hostContext?.displayMode ?? "unknown"}</span>
      </div>
    </div>
  );
}
