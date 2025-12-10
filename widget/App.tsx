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
 * - ui/size-change: Size Change Widget
 */

import { useEffect, useState } from "react";
import {
  App,
  PostMessageTransport,
  McpUiToolInputNotificationSchema,
  McpUiToolResultNotificationSchema,
  McpUiHostContextChangedNotificationSchema,
} from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ToolCallWidget } from "./widgets/ToolCallWidget";
import { OpenLinkWidget } from "./widgets/OpenLinkWidget";
import { ReadResourceWidget } from "./widgets/ReadResourceWidget";
import { MessageWidget } from "./widgets/MessageWidget";
import { CspTestWidget } from "./widgets/CspTestWidget";
import { SizeChangeWidget } from "./widgets/SizeChangeWidget";
import { LocaleTimezoneWidget } from "./widgets/LocaleTimezoneWidget";
import { HostContextWidget } from "./widgets/HostContextWidget";

type WidgetType = "tool-call" | "open-link" | "read-resource" | "message" | "csp-test" | "size-change" | "locale-timezone" | "host-context" | null;

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

export function AppComponent() {
  // App connection state
  const [app, setApp] = useState<App | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Local state for notifications
  const [toolInput, setToolInput] = useState<ToolInput | null>(null);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [hostContext, setHostContext] = useState<HostContext | null>(null);

  // Debug: Log all incoming postMessages
  useEffect(() => {
    const debugHandler = (event: MessageEvent) => {
      if (event.data?.method?.includes("host-context")) {
        console.log("[App DEBUG] Raw postMessage received:", event.data);
      }
    };
    window.addEventListener("message", debugHandler);
    return () => window.removeEventListener("message", debugHandler);
  }, []);

  // Create and connect App manually with autoResize disabled
  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        const myApp = new App(
          { name: "mcp-apps-everything", version: "0.0.1" },
          {}, // capabilities
          { autoResize: false }
        );

        // Register notification handlers BEFORE connecting
        myApp.setNotificationHandler(McpUiToolInputNotificationSchema, (n) => {
          setToolInput({ arguments: n.params.arguments ?? {} });
        });

        myApp.setNotificationHandler(McpUiToolResultNotificationSchema, (n) => {
          setToolResult({
            content: n.params.content,
            structuredContent: n.params.structuredContent,
            isError: n.params.isError,
          });
        });

        myApp.setNotificationHandler(McpUiHostContextChangedNotificationSchema, (n) => {
          console.log("[App] Received host-context-changed:", n);
          setHostContext((prev) => ({ ...prev, ...n.params }));
        });

        const transport = new PostMessageTransport(window.parent);
        await myApp.connect(transport);

        if (mounted) {
          setApp(myApp);
          setIsConnected(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Failed to connect"));
        }
      }
    }

    connect();

    return () => {
      mounted = false;
    };
  }, []);

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
      <div className="flex items-center justify-center p-4">
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
    <div>
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
      {widgetType === "csp-test" && (
        <CspTestWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
      {widgetType === "size-change" && (
        <SizeChangeWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
      {widgetType === "locale-timezone" && (
        <LocaleTimezoneWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
      {widgetType === "host-context" && (
        <HostContextWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
    </div>
  );
}
