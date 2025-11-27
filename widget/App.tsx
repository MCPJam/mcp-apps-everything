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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { cn } from "./lib/utils";

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
      <div className={cn("min-h-screen p-8 flex flex-col items-center justify-center", isDark && "dark")}>
        <div className="text-4xl mb-4">&#x23F3;</div>
        <div className="text-muted-foreground">Connecting to host...</div>
      </div>
    );
  }

  // No widget detected - show help
  if (!widgetType) {
    return (
      <div className={cn("min-h-screen p-6", isDark && "dark")}>
        <Card>
          <CardHeader>
            <CardTitle>MCP Apps Demo</CardTitle>
            <CardDescription>Waiting for tool result...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-semibold text-sm">Available Tools:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code className="bg-muted px-1 py-0.5 rounded text-xs">show-counter</code> - tools/call demo</li>
                <li><code className="bg-muted px-1 py-0.5 rounded text-xs">show-weather</code> - ui/open-link demo</li>
                <li><code className="bg-muted px-1 py-0.5 rounded text-xs">show-notes</code> - resources/read demo</li>
                <li><code className="bg-muted px-1 py-0.5 rounded text-xs">show-chat</code> - ui/message demo</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const info = widgetInfo[widgetType];

  return (
    <div className={cn("min-h-screen p-4", isDark && "dark")}>
      <Card className="h-full">
        {/* Header with API info */}
        <CardHeader className="border-b pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="capitalize">{widgetType} Widget</CardTitle>
              <CardDescription>{info?.description}</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {info?.api}
            </Badge>
          </div>
        </CardHeader>

        {/* Widget Content */}
        <CardContent className="min-h-[280px] pt-4">
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
        </CardContent>

        {/* Footer with theme info */}
        <CardFooter className="border-t pt-4 text-xs text-muted-foreground justify-between">
          <span>Theme: {theme}</span>
          <span>Mode: {hostContext?.displayMode ?? "unknown"}</span>
        </CardFooter>
      </Card>
    </div>
  );
}
