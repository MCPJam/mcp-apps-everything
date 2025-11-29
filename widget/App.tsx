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

import { useEffect, useState } from "react";
import {
  useApp,
  App,
  McpUiToolInputNotificationSchema,
  McpUiToolResultNotificationSchema,
  McpUiHostContextChangedNotificationSchema,
} from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ToolCallWidget } from "./widgets/ToolCallWidget";
import { OpenLinkWidget } from "./widgets/OpenLinkWidget";
import { ReadResourceWidget } from "./widgets/ReadResourceWidget";
import { MessageWidget } from "./widgets/MessageWidget";

type WidgetType = "tool-call" | "open-link" | "read-resource" | "message" | null;

interface ToolInput {
  arguments: Record<string, unknown>;
}

interface ToolResult {
  content?: CallToolResult["content"];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

interface HostContext {
  theme?: "light" | "dark" | "system";
}

export function App() {
  // Local state for notifications
  const [toolInput, setToolInput] = useState<ToolInput | null>(null);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [hostContext, setHostContext] = useState<HostContext | null>(null);

  // Use the SDK directly
  const { app, isConnected, error } = useApp({
    appInfo: { name: "mcp-apps-everything", version: "0.0.1" },
    capabilities: {},
    onAppCreated: (app: App) => {
      // Register notification handlers before connection
      app.setNotificationHandler(McpUiToolInputNotificationSchema, (n) => {
        setToolInput({ arguments: n.params.arguments ?? {} });
      });

      app.setNotificationHandler(McpUiToolResultNotificationSchema, (n) => {
        setToolResult({
          content: n.params.content,
          structuredContent: n.params.structuredContent,
          isError: n.params.isError,
        });
      });

      app.setNotificationHandler(McpUiHostContextChangedNotificationSchema, (n) => {
        setHostContext((prev) => ({ ...prev, ...n.params }));
      });
    },
  });

  // Get initial host context once connected
  useEffect(() => {
    if (isConnected && app) {
      const initialContext = app.getHostContext();
      if (initialContext) {
        setHostContext(initialContext);
      }
    }
  }, [isConnected, app]);

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
        <ToolCallWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
      {widgetType === "open-link" && (
        <OpenLinkWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
      {widgetType === "read-resource" && (
        <ReadResourceWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
      {widgetType === "message" && <MessageWidget app={app!} />}
    </div>
  );
}
