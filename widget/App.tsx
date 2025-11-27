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
import { cn } from "./lib/utils";

type WidgetType = "counter" | "weather" | "notes" | "chat" | null;

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

  const isDark = hostContext?.theme === "dark";

  // Apply dark mode to document root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Connecting...</div>
      </div>
    );
  }

  // No widget detected
  if (!widgetType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Waiting for tool result...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {widgetType === "counter" && (
        <CounterWidget
          toolInput={toolInput}
          toolResult={toolResult}
          callTool={callTool}
        />
      )}
      {widgetType === "weather" && (
        <WeatherWidget
          toolInput={toolInput}
          toolResult={toolResult}
          openLink={openLink}
        />
      )}
      {widgetType === "notes" && (
        <NotesWidget
          toolInput={toolInput}
          readResource={readResource}
          callTool={callTool}
        />
      )}
      {widgetType === "chat" && (
        <ChatWidget sendMessage={sendMessage} />
      )}
    </div>
  );
}
