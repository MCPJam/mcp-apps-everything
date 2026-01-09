/**
 * Partial Input Test Widget - Tests ui/notifications/tool-input-partial streaming
 *
 * Demonstrates SEP-1865 partial input streaming from host to widget.
 * Shows partial inputs as they stream in, then displays final input.
 */

import { useState, useEffect, useCallback } from "react";
import { Activity, CheckCircle2, Clock, Zap } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";
import { McpUiToolInputNotificationSchema } from "@modelcontextprotocol/ext-apps/react";

interface PartialInputTestWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

interface PartialInputEvent {
  timestamp: number;
  args: Record<string, unknown>;
  keys: string[];
}

export function PartialInputTestWidget({ app, toolInput, toolResult }: PartialInputTestWidgetProps) {
  const [partialInputs, setPartialInputs] = useState<PartialInputEvent[]>([]);
  const [finalInput, setFinalInput] = useState<Record<string, unknown> | null>(null);
  const [receivedPartialNotification, setReceivedPartialNotification] = useState(false);

  // Handler for partial input notifications
  const handlePartialInput = useCallback((params: { arguments?: Record<string, unknown> }) => {
    console.log("[PartialInputTestWidget] Received partial input:", params);
    setReceivedPartialNotification(true);
    const args = params.arguments ?? {};
    setPartialInputs((prev) => [
      ...prev,
      {
        timestamp: Date.now(),
        args,
        keys: Object.keys(args),
      },
    ]);
  }, []);

  // Handler for final input notification
  const handleFinalInput = useCallback((params: { arguments?: Record<string, unknown> }) => {
    console.log("[PartialInputTestWidget] Received final input:", params);
    setFinalInput(params.arguments ?? {});
  }, []);

  // Subscribe to SDK notifications (only for available schemas)
  useEffect(() => {
    console.log("[PartialInputTestWidget] Setting up SDK notification handlers");

    // Listen for final input via SDK
    app.setNotificationHandler(McpUiToolInputNotificationSchema, (notification) => {
      handleFinalInput(notification.params as { arguments?: Record<string, unknown> });
    });

    // Note: McpUiToolInputPartialNotificationSchema not available in current SDK build,
    // using raw postMessage workaround below instead
  }, [app, handleFinalInput]);

  // WORKAROUND: Also listen for raw postMessage in case SDK doesn't route it
  useEffect(() => {
    const handleRawMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data?.jsonrpc === "2.0") {
        if (data?.method === "ui/notifications/tool-input-partial") {
          console.log("[PartialInputTestWidget] Raw postMessage partial input:", data);
          handlePartialInput(data.params as { arguments?: Record<string, unknown> });
        }
        if (data?.method === "ui/notifications/tool-input") {
          console.log("[PartialInputTestWidget] Raw postMessage final input:", data);
          handleFinalInput(data.params as { arguments?: Record<string, unknown> });
        }
      }
    };
    window.addEventListener("message", handleRawMessage);
    return () => window.removeEventListener("message", handleRawMessage);
  }, [handlePartialInput, handleFinalInput]);

  // Also use toolInput prop as fallback for final input
  useEffect(() => {
    if (toolInput?.arguments && !finalInput) {
      setFinalInput(toolInput.arguments);
    }
  }, [toolInput, finalInput]);

  const hasPartialInputs = partialInputs.length > 0;
  const hasFinalInput = finalInput !== null;

  return (
    <div className="flex flex-col min-h-[400px] p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-light mb-2">Partial Input Streaming Test</h2>
        <p className="text-sm text-muted-foreground">
          Tests <code className="bg-muted px-1 rounded">ui/notifications/tool-input-partial</code> (SEP-1865)
        </p>
      </div>

      {/* Status Indicators */}
      <div className="flex justify-center gap-4 mb-6">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
            receivedPartialNotification
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {receivedPartialNotification ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          <span>
            {receivedPartialNotification
              ? `${partialInputs.length} partial inputs received`
              : "Waiting for partial inputs..."}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
            hasFinalInput
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {hasFinalInput ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          <span>{hasFinalInput ? "Final input received" : "Waiting for final input..."}</span>
        </div>
      </div>

      {/* Streaming Activity */}
      {hasPartialInputs && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            <h3 className="text-sm font-medium">Streaming Activity</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-auto">
            {partialInputs.map((partial, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg text-xs"
              >
                <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <Zap className="h-3 w-3" />
                  <span>#{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-muted-foreground mb-1">
                    Keys: {partial.keys.join(", ") || "(empty)"}
                  </div>
                  <pre className="font-mono bg-background/50 p-2 rounded overflow-auto">
                    {JSON.stringify(partial.args, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Input */}
      {hasFinalInput && (
        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-medium">Final Input</h3>
          </div>
          <pre className="font-mono text-xs bg-muted/30 p-4 rounded-lg overflow-auto">
            {JSON.stringify(finalInput, null, 2)}
          </pre>
        </div>
      )}

      {/* Tool Result Info */}
      {toolResult?.structuredContent && (
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">Tool Result</h3>
          <pre className="font-mono text-xs bg-muted/30 p-2 rounded overflow-auto">
            {JSON.stringify(toolResult.structuredContent, null, 2)}
          </pre>
        </div>
      )}

      {/* Help Text */}
      {!hasPartialInputs && !hasFinalInput && (
        <div className="mt-auto text-center text-sm text-muted-foreground">
          <p>Call this tool with a long query to see partial input streaming.</p>
          <p className="mt-1">
            The host should send <code className="bg-muted px-1 rounded">ui/notifications/tool-input-partial</code>{" "}
            events as arguments stream in.
          </p>
        </div>
      )}
    </div>
  );
}
