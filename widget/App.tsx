/**
 * MCP Apps Everything - Demo App
 *
 * Auto-detects and renders the appropriate widget based on tool result.
 * Each tool includes a `_widget` field in structuredContent to identify itself.
 *
 * Showcases all SEP-1865 APIs:
 * - tools/call: Tool Call Widget
 * - ui/open-link: Open Link Widget
 * - resources/read: Read Resource Widget
 * - ui/message: Message Widget
 */

import { useEffect } from "react";
import { useApp } from "./hooks/useApp";
import { ToolCallWidget } from "./widgets/ToolCallWidget";
import { OpenLinkWidget } from "./widgets/OpenLinkWidget";
import { ReadResourceWidget } from "./widgets/ReadResourceWidget";
import { MessageWidget } from "./widgets/MessageWidget";

type WidgetType = "tool-call" | "open-link" | "read-resource" | "message" | null;

export function App() {
  const {
    isConnected,
    error,
    hostContext,
    toolInput,
    toolResult,
    callTool,
    readResource,
    sendMessage,
    openLink,
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

  // Loading state or error
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          {error ? (
            <div className="text-red-500 text-sm">
              <div className="font-medium mb-1">Connection Error:</div>
              <div className="text-xs font-mono bg-red-500/10 p-2 rounded max-w-md overflow-auto">
                {error.message}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Connecting...</div>
          )}
        </div>
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
      {widgetType === "tool-call" && (
        <ToolCallWidget
          toolInput={toolInput}
          toolResult={toolResult}
          callTool={callTool}
        />
      )}
      {widgetType === "open-link" && (
        <OpenLinkWidget
          toolInput={toolInput}
          toolResult={toolResult}
          openLink={openLink}
        />
      )}
      {widgetType === "read-resource" && (
        <ReadResourceWidget
          toolInput={toolInput}
          toolResult={toolResult}
          readResource={readResource}
        />
      )}
      {widgetType === "message" && (
        <MessageWidget sendMessage={sendMessage} />
      )}
    </div>
  );
}
