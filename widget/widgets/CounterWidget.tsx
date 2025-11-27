/**
 * Counter Widget - Demonstrates tools/call API
 *
 * Features:
 * - Calls the "increment" tool via tools/call
 * - Shows tool input/result handling
 * - Theme-aware styling
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { CallToolResult } from "../../shared/types";

interface CounterWidgetProps {
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
  callTool: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
}

export function CounterWidget({ toolInput, toolResult, callTool }: CounterWidgetProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Initialize from tool input
  useEffect(() => {
    if (toolInput?.arguments?.count !== undefined) {
      const initialCount = toolInput.arguments.count as number;
      setCount(initialCount);
      setHistory((h) => [...h, `Initialized with count: ${initialCount}`]);
    }
  }, [toolInput]);

  // Update from tool result
  useEffect(() => {
    if (toolResult?.structuredContent?.count !== undefined) {
      setCount(toolResult.structuredContent.count as number);
    }
  }, [toolResult]);

  const handleIncrement = async (amount: number) => {
    setLoading(true);
    try {
      const result = await callTool("increment", { count, amount });
      if (result.structuredContent?.count !== undefined) {
        const newCount = result.structuredContent.count as number;
        setCount(newCount);
        setHistory((h) => [...h, `Incremented by ${amount} -> ${newCount}`]);
      }
    } catch (err) {
      setHistory((h) => [...h, `Error: ${err instanceof Error ? err.message : "Unknown"}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm text-muted-foreground mb-2">tools/call Demo</h3>

      <div className="text-6xl font-bold my-6 text-center">{count}</div>

      <div className="flex gap-2 justify-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleIncrement(1)}
          disabled={loading}
        >
          +1
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleIncrement(5)}
          disabled={loading}
        >
          +5
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleIncrement(10)}
          disabled={loading}
        >
          +10
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleIncrement(-1)}
          disabled={loading}
        >
          -1
        </Button>
      </div>

      {history.length > 0 && (
        <div className="mt-4 p-3 bg-muted rounded-lg text-sm max-h-[100px] overflow-auto">
          <div className="font-semibold mb-1">History:</div>
          {history.slice(-5).map((entry, i) => (
            <div key={i} className="text-muted-foreground">
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
