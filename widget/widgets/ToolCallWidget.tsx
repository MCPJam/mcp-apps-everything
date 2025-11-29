/**
 * Tool Call Widget - Demonstrates tools/call API
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

interface ToolCallWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

export function ToolCallWidget({ app, toolInput, toolResult }: ToolCallWidgetProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastChange, setLastChange] = useState<number | null>(null);

  useEffect(() => {
    if (toolInput?.arguments?.count !== undefined) {
      setCount(toolInput.arguments.count as number);
    }
  }, [toolInput]);

  useEffect(() => {
    if (toolResult?.structuredContent?.count !== undefined) {
      setCount(toolResult.structuredContent.count as number);
    }
  }, [toolResult]);

  const handleIncrement = async (amount: number) => {
    setLoading(true);
    try {
      // Call the server tool directly via the SDK
      const result: CallToolResult = await app.callServerTool({
        name: "increment",
        arguments: { count, amount },
      });
      if (result.structuredContent?.count !== undefined) {
        const newCount = result.structuredContent.count as number;
        setCount(newCount);
        setLastChange(amount);
        setTimeout(() => setLastChange(null), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const result: CallToolResult = await app.callServerTool({
        name: "increment",
        arguments: { count, amount: -count },
      });
      if (result.structuredContent?.count !== undefined) {
        const newCount = result.structuredContent.count as number;
        setCount(newCount);
        setLastChange(-count);
        setTimeout(() => setLastChange(null), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      {/* Counter Display */}
      <div className="relative mb-12">
        <div className="text-7xl font-light tabular-nums tracking-tighter text-foreground">
          {count}
        </div>
        {lastChange !== null && (
          <span className={`absolute -right-12 top-3 text-sm font-medium text-muted-foreground`}>
            {lastChange > 0 ? `+${lastChange}` : lastChange}
          </span>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={handleReset}
          disabled={loading || count === 0}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="lg"
            className="h-10 px-4"
            onClick={() => handleIncrement(1)}
            disabled={loading}
          >
            +1
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-10 px-4"
            onClick={() => handleIncrement(5)}
            disabled={loading}
          >
            +5
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-10 px-4"
            onClick={() => handleIncrement(10)}
            disabled={loading}
          >
            +10
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-8 text-xs text-muted-foreground">
          Updating...
        </div>
      )}
    </div>
  );
}
