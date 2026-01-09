/**
 * Interactive Cancellation Widget - Widget-initiated tool calls with cancellation
 *
 * Demonstrates calling a tool from within a widget and cancelling it using AbortController.
 * The widget calls the `cancellation-test` tool and can cancel it mid-execution.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Square, XCircle, CheckCircle2, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { App } from "@modelcontextprotocol/ext-apps/react";
import { McpUiToolCancelledNotificationSchema } from "@modelcontextprotocol/ext-apps/react";

interface InteractiveCancellationWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

type ToolStatus = "idle" | "running" | "completed" | "cancelled" | "error";

interface RunResult {
  status: ToolStatus;
  message: string;
  duration?: number;
}

export function InteractiveCancellationWidget({ app, toolInput }: InteractiveCancellationWidgetProps) {
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [runHistory, setRunHistory] = useState<RunResult[]>([]);
  const [hostCancelReceived, setHostCancelReceived] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const duration = (toolInput?.arguments?.duration as number) ?? 5000;

  // Listen for host-initiated cancellation notifications
  useEffect(() => {
    app.setNotificationHandler(McpUiToolCancelledNotificationSchema, (notification) => {
      console.log("[InteractiveCancellationWidget] Host cancelled:", notification);
      setHostCancelReceived(true);
    });
  }, [app]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleStart = useCallback(async () => {
    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus("running");
    setMessage(`Calling cancellation-test with ${duration}ms duration...`);
    setElapsedTime(0);
    setHostCancelReceived(false);
    startTimer();

    try {
      const result = await app.callServerTool(
        {
          name: "cancellation-test",
          arguments: { duration },
        },
        { signal: controller.signal }
      );

      stopTimer();
      const finalElapsed = Date.now() - startTimeRef.current;

      if (result.isError) {
        setStatus("error");
        setMessage("Tool returned an error");
        setRunHistory(prev => [...prev, { status: "error", message: "Tool error", duration: finalElapsed }]);
      } else {
        setStatus("completed");
        setMessage(`Tool completed successfully after ${finalElapsed}ms`);
        setRunHistory(prev => [...prev, { status: "completed", message: "Completed", duration: finalElapsed }]);
      }
    } catch (error) {
      stopTimer();
      const finalElapsed = Date.now() - startTimeRef.current;

      if (error instanceof Error && error.name === "AbortError") {
        setStatus("cancelled");
        setMessage(`Cancelled by widget after ${finalElapsed}ms`);
        setRunHistory(prev => [...prev, { status: "cancelled", message: "Widget cancelled", duration: finalElapsed }]);
      } else {
        setStatus("error");
        setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        setRunHistory(prev => [...prev, { status: "error", message: String(error), duration: finalElapsed }]);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [app, duration, startTimer, stopTimer]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setMessage("Cancellation requested...");
    }
  }, []);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setMessage("");
    setElapsedTime(0);
    setHostCancelReceived(false);
  }, []);

  const statusConfig = {
    idle: {
      icon: Play,
      iconClass: "h-10 w-10 text-muted-foreground",
      bgClass: "bg-muted/30",
      textClass: "text-muted-foreground",
      label: "Ready",
    },
    running: {
      icon: Loader2,
      iconClass: "h-10 w-10 text-blue-500 animate-spin",
      bgClass: "bg-blue-500/10",
      textClass: "text-blue-600 dark:text-blue-400",
      label: "Running",
    },
    completed: {
      icon: CheckCircle2,
      iconClass: "h-10 w-10 text-green-500",
      bgClass: "bg-green-500/10",
      textClass: "text-green-600 dark:text-green-400",
      label: "Completed",
    },
    cancelled: {
      icon: XCircle,
      iconClass: "h-10 w-10 text-orange-500",
      bgClass: "bg-orange-500/10",
      textClass: "text-orange-600 dark:text-orange-400",
      label: "Cancelled",
    },
    error: {
      icon: AlertCircle,
      iconClass: "h-10 w-10 text-red-500",
      bgClass: "bg-red-500/10",
      textClass: "text-red-600 dark:text-red-400",
      label: "Error",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex flex-col min-h-[400px] p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-light mb-2">Interactive Cancellation Test</h2>
        <p className="text-sm text-muted-foreground">
          Widget-initiated tool call with <code className="bg-muted px-1 rounded">AbortController</code> cancellation
        </p>
      </div>

      {/* Main Status Display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* Status Icon */}
        <div className={`p-5 rounded-full ${config.bgClass}`}>
          <StatusIcon className={config.iconClass} />
        </div>

        {/* Status Label */}
        <div className="text-center">
          <div className={`text-xl font-semibold ${config.textClass}`}>{config.label}</div>
          {message && <div className="text-sm text-muted-foreground mt-1 max-w-md">{message}</div>}
        </div>

        {/* Timer Display */}
        {status === "running" && (
          <div className="font-mono text-2xl tabular-nums text-muted-foreground">
            {(elapsedTime / 1000).toFixed(1)}s / {(duration / 1000).toFixed(1)}s
          </div>
        )}

        {/* Progress Bar */}
        {status === "running" && (
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${Math.min((elapsedTime / duration) * 100, 100)}%` }}
            />
          </div>
        )}

        {/* Host Cancel Notification */}
        {hostCancelReceived && (
          <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-sm">
            Host cancellation notification received
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mt-6">
        {status === "idle" && (
          <Button onClick={handleStart} size="lg" className="gap-2">
            <Play className="h-4 w-4" />
            Start ({(duration / 1000).toFixed(0)}s operation)
          </Button>
        )}

        {status === "running" && (
          <Button onClick={handleCancel} variant="destructive" size="lg" className="gap-2">
            <Square className="h-4 w-4" />
            Cancel
          </Button>
        )}

        {(status === "completed" || status === "cancelled" || status === "error") && (
          <Button onClick={handleReset} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Run History */}
      {runHistory.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Run History</h3>
          <div className="flex flex-wrap gap-2">
            {runHistory.map((run, i) => (
              <div
                key={i}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  run.status === "completed"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : run.status === "cancelled"
                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                #{i + 1}: {run.status} ({run.duration}ms)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>
          This widget calls <code className="bg-muted px-1 rounded">cancellation-test</code> via{" "}
          <code className="bg-muted px-1 rounded">app.callServerTool()</code>
        </p>
        <p className="mt-1">
          Cancel button aborts the request using <code className="bg-muted px-1 rounded">AbortController</code>
        </p>
      </div>
    </div>
  );
}
