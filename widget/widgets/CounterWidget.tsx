/**
 * Counter Widget - Demonstrates tools/call API
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import type { CallToolResult } from "../../shared/types";

interface CounterWidgetProps {
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
  callTool: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
}

export function CounterWidget({ toolInput, toolResult, callTool }: CounterWidgetProps) {
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
      const result = await callTool("increment", { count, amount });
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
      {/* Counter Display */}
      <div className="relative mb-8">
        <div className="text-8xl font-bold tabular-nums tracking-tight text-foreground">
          {count}
        </div>
        {lastChange !== null && (
          <span className={`absolute -right-8 top-2 text-lg font-semibold animate-pulse ${lastChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {lastChange > 0 ? `+${lastChange}` : lastChange}
          </span>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-12 w-12 rounded-full p-0 transition-all hover:scale-110 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950"
          onClick={() => handleIncrement(-1)}
          disabled={loading}
        >
          <Minus className="h-5 w-5" />
        </Button>

        <div className="flex gap-2">
          <Button
            size="lg"
            className="h-14 px-6 rounded-full text-lg font-semibold transition-all hover:scale-105"
            onClick={() => handleIncrement(1)}
            disabled={loading}
          >
            <Plus className="h-5 w-5 mr-1" />
            1
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="h-14 px-6 rounded-full text-lg font-semibold transition-all hover:scale-105"
            onClick={() => handleIncrement(5)}
            disabled={loading}
          >
            <Plus className="h-5 w-5 mr-1" />
            5
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="h-14 px-6 rounded-full text-lg font-semibold transition-all hover:scale-105"
            onClick={() => handleIncrement(10)}
            disabled={loading}
          >
            <Plus className="h-5 w-5 mr-1" />
            10
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-6 text-sm text-muted-foreground animate-pulse">
          Updating...
        </div>
      )}
    </div>
  );
}
