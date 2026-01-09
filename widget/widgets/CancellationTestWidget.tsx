/**
 * Cancellation Test Widget - Tests ui/notifications/tool-cancelled handling
 *
 * Demonstrates SEP-1865 tool cancellation notifications.
 * Shows status updates when a tool is cancelled by the host.
 */

import { useState, useEffect, useCallback } from "react";
import { XCircle, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";
import { McpUiToolResultNotificationSchema } from "@modelcontextprotocol/ext-apps/react";

interface CancellationTestWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown>; isError?: boolean } | null;
}

type ToolStatus = "running" | "completed" | "cancelled" | "error";

export function CancellationTestWidget({ app, toolInput, toolResult }: CancellationTestWidgetProps) {
  const [status, setStatus] = useState<ToolStatus>("running");
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [cancelledAt, setCancelledAt] = useState<number | null>(null);
  const [startTime] = useState<number>(Date.now());

  // Handler for tool cancellation
  const handleToolCancelled = useCallback((params: { reason?: string }) => {
    console.log("[CancellationTestWidget] Tool cancelled:", params);
    setStatus("cancelled");
    setCancelReason(params.reason ?? "No reason provided");
    setCancelledAt(Date.now());
  }, []);

  // Handler for tool result
  const handleToolResult = useCallback((params: { isError?: boolean }) => {
    console.log("[CancellationTestWidget] Tool result received:", params);
    if (params.isError) {
      setStatus("error");
    } else {
      setStatus("completed");
    }
  }, []);

  // Subscribe to SDK notifications (only for available schemas)
  useEffect(() => {
    console.log("[CancellationTestWidget] Setting up SDK notification handlers");

    // Listen for result via SDK
    app.setNotificationHandler(McpUiToolResultNotificationSchema, (notification) => {
      handleToolResult(notification.params as { isError?: boolean });
    });

    // Note: McpUiToolCancelledNotificationSchema not available in current SDK build,
    // using raw postMessage workaround below instead
  }, [app, handleToolResult]);

  // WORKAROUND: Also listen for raw postMessage in case SDK doesn't route it
  useEffect(() => {
    const handleRawMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data?.jsonrpc === "2.0") {
        if (data?.method === "ui/notifications/tool-cancelled") {
          console.log("[CancellationTestWidget] Raw postMessage cancelled:", data);
          handleToolCancelled(data.params as { reason?: string });
        }
        if (data?.method === "ui/notifications/tool-result") {
          console.log("[CancellationTestWidget] Raw postMessage result:", data);
          handleToolResult(data.params as { isError?: boolean });
        }
      }
    };
    window.addEventListener("message", handleRawMessage);
    return () => window.removeEventListener("message", handleRawMessage);
  }, [handleToolCancelled, handleToolResult]);

  // Also update from toolResult prop
  useEffect(() => {
    if (toolResult) {
      if (toolResult.isError) {
        setStatus("error");
      } else if (status === "running") {
        setStatus("completed");
      }
    }
  }, [toolResult, status]);

  const duration = toolInput?.arguments?.duration as number | undefined;
  const elapsedTime = cancelledAt ? cancelledAt - startTime : null;

  const statusConfig = {
    running: {
      icon: Loader2,
      iconClass: "h-12 w-12 text-blue-500 animate-spin",
      bgClass: "bg-blue-500/10",
      textClass: "text-blue-600 dark:text-blue-400",
      label: "Running",
      description: `Simulating long operation${duration ? ` (${duration}ms)` : ""}...`,
    },
    completed: {
      icon: CheckCircle2,
      iconClass: "h-12 w-12 text-green-500",
      bgClass: "bg-green-500/10",
      textClass: "text-green-600 dark:text-green-400",
      label: "Completed",
      description: "Tool execution completed successfully",
    },
    cancelled: {
      icon: XCircle,
      iconClass: "h-12 w-12 text-orange-500",
      bgClass: "bg-orange-500/10",
      textClass: "text-orange-600 dark:text-orange-400",
      label: "Cancelled",
      description: cancelReason ?? "Tool execution was cancelled",
    },
    error: {
      icon: AlertCircle,
      iconClass: "h-12 w-12 text-red-500",
      bgClass: "bg-red-500/10",
      textClass: "text-red-600 dark:text-red-400",
      label: "Error",
      description: "Tool execution encountered an error",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex flex-col min-h-[350px] p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-light mb-2">Tool Cancellation Test</h2>
        <p className="text-sm text-muted-foreground">
          Tests <code className="bg-muted px-1 rounded">ui/notifications/tool-cancelled</code> (SEP-1865)
        </p>
      </div>

      {/* Main Status Display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Status Icon */}
        <div className={`p-6 rounded-full ${config.bgClass}`}>
          <StatusIcon className={config.iconClass} />
        </div>

        {/* Status Label */}
        <div className="text-center">
          <div className={`text-2xl font-semibold ${config.textClass}`}>{config.label}</div>
          <div className="text-sm text-muted-foreground mt-1">{config.description}</div>
        </div>

        {/* Timing Info */}
        {status === "cancelled" && elapsedTime !== null && (
          <div className="text-xs text-muted-foreground">
            Cancelled after {elapsedTime}ms of {duration ?? "?"}ms
          </div>
        )}

        {/* Cancel Reason Detail */}
        {status === "cancelled" && cancelReason && (
          <div className="bg-muted/30 rounded-lg p-4 max-w-md text-center">
            <div className="text-xs font-medium text-muted-foreground mb-1">Cancellation Reason</div>
            <div className="text-sm font-mono">{cancelReason}</div>
          </div>
        )}
      </div>

      {/* Help Text */}
      {status === "running" && (
        <div className="mt-auto text-center text-sm text-muted-foreground border-t border-border pt-4">
          <p className="font-medium mb-1">How to test:</p>
          <p>Cancel the tool call in the host application to trigger the cancellation notification.</p>
          <p className="text-xs mt-2">
            The host should send{" "}
            <code className="bg-muted px-1 rounded">ui/notifications/tool-cancelled</code> with an optional reason.
          </p>
        </div>
      )}

      {/* Success/Failure Summary */}
      {(status === "completed" || status === "cancelled") && (
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm">
            {status === "cancelled" ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  Cancellation notification received correctly!
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-600 dark:text-yellow-400">
                  Tool completed without cancellation (try cancelling before it finishes)
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
