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
  McpUiToolCancelledNotificationSchema,
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
} from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps/react";
import { ToolCallWidget } from "./widgets/ToolCallWidget";
import { OpenLinkWidget } from "./widgets/OpenLinkWidget";
import { ReadResourceWidget } from "./widgets/ReadResourceWidget";
import { MessageWidget } from "./widgets/MessageWidget";
import { CspTestWidget } from "./widgets/CspTestWidget";
import { SizeChangeWidget } from "./widgets/SizeChangeWidget";
import { LocaleTimezoneWidget } from "./widgets/LocaleTimezoneWidget";
import { HostContextWidget } from "./widgets/HostContextWidget";
import { MimeTypeTestWidget } from "./widgets/MimeTypeTestWidget";
import { RouterTestWidget } from "./widgets/RouterTestWidget";
import { PartialInputTestWidget } from "./widgets/PartialInputTestWidget";
import { CancellationTestWidget } from "./widgets/CancellationTestWidget";
import { ThemingTestWidget } from "./widgets/ThemingTestWidget";
import { InteractiveCancellationWidget } from "./widgets/InteractiveCancellationWidget";

type WidgetType = "tool-call" | "open-link" | "read-resource" | "message" | "csp-test" | "size-change" | "locale-timezone" | "host-context" | "mime-type-test" | "router-test" | "partial-input-test" | "cancellation-test" | "theming-test" | "interactive-cancellation" | null;

interface ToolInput {
  arguments: Record<string, unknown>;
}

interface ToolResult {
  content?: CallToolResult["content"];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}


export function AppComponent() {
  // App connection state
  const [app, setApp] = useState<App | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Local state for notifications
  const [toolInput, setToolInput] = useState<ToolInput | null>(null);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | null>(null);
  const [cancelled, setCancelled] = useState<{ reason?: string } | null>(null);

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

        myApp.setNotificationHandler(McpUiToolCancelledNotificationSchema, (n) => {
          console.log("[App] Received tool-cancelled:", n);
          setCancelled({ reason: n.params.reason });
        });

        const transport = new PostMessageTransport(window.parent, window.parent);
        await myApp.connect(transport);

        if (mounted) {
          // Get initial host context and apply styles
          const initialContext = myApp.getHostContext();
          if (initialContext) {
            if (initialContext.theme) {
              applyDocumentTheme(initialContext.theme);
            }
            if (initialContext.styles?.variables) {
              applyHostStyleVariables(initialContext.styles.variables);
            }
            if (initialContext.styles?.css?.fonts) {
              applyHostFonts(initialContext.styles.css.fonts);
            }
            setHostContext(initialContext);
          }

          // Set up handler for ongoing host context changes
          myApp.onhostcontextchanged = (params: McpUiHostContext) => {
            console.log("[App] Host context changed:", params);
            if (params.theme) {
              applyDocumentTheme(params.theme);
            }
            if (params.styles?.variables) {
              applyHostStyleVariables(params.styles.variables);
            }
            if (params.styles?.css?.fonts) {
              applyHostFonts(params.styles.css.fonts);
            }
            setHostContext((prev) => ({ ...prev, ...params }));
          };

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

  // Apply Tailwind dark mode class based on host theme
  // Note: applyDocumentTheme already sets data-theme and color-scheme,
  // but Tailwind also needs the "dark" class on documentElement
  useEffect(() => {
    const isDark = hostContext?.theme === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [hostContext?.theme]);

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

  // No widget detected - show waiting or cancelled state
  if (!widgetType) {
    // Show cancelled state
    if (cancelled) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 mb-3">
              <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-orange-600 dark:text-orange-400 font-medium mb-1">Tool Cancelled</div>
            <div className="text-sm text-muted-foreground">
              {cancelled.reason ?? "Operation was cancelled"}
            </div>
          </div>
        </div>
      );
    }

    // Show waiting state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 mb-2">
            <svg className="w-5 h-5 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div className="text-muted-foreground">Waiting for tool result...</div>
        </div>
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
        <HostContextWidget app={app!} toolInput={toolInput} toolResult={toolResult} hostContext={hostContext} />
      )}
      {widgetType === "mime-type-test" && (
        <MimeTypeTestWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
      {widgetType === "router-test" && (
        <RouterTestWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
      {widgetType === "partial-input-test" && (
        <PartialInputTestWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
      {widgetType === "cancellation-test" && (
        <CancellationTestWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
      {widgetType === "theming-test" && (
        <ThemingTestWidget app={app!} toolInput={toolInput} toolResult={toolResult} hostContext={hostContext} />
      )}
      {widgetType === "interactive-cancellation" && (
        <InteractiveCancellationWidget app={app!} toolInput={toolInput} toolResult={toolResult} />
      )}
    </div>
  );
}
