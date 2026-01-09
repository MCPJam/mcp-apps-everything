/**
 * Size Change Widget - Demonstrates ui/size-change API
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";

interface SizeChangeWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

const PRESET_HEIGHTS = [200, 300, 400, 500, 600, 800];
const MIN_HEIGHT = 200;
const MAX_HEIGHT = 800;

export function SizeChangeWidget({ app, toolInput, toolResult }: SizeChangeWidgetProps) {
  const [height, setHeight] = useState(300);
  const [loading, setLoading] = useState(false);
  const [lastChange, setLastChange] = useState<number | null>(null);

  // Send initial size on mount
  useEffect(() => {
    app.sendSizeChanged({ height: 300 });
  }, [app]);

  useEffect(() => {
    if (toolInput?.arguments?.height !== undefined) {
      const inputHeight = toolInput.arguments.height as number;
      const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, inputHeight));
      setHeight(clampedHeight);
      app.sendSizeChanged({ height: clampedHeight });
    }
  }, [toolInput, app]);

  useEffect(() => {
    if (toolResult?.structuredContent?.height !== undefined) {
      const resultHeight = toolResult.structuredContent.height as number;
      const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resultHeight));
      setHeight(clampedHeight);
      app.sendSizeChanged({ height: clampedHeight });
    }
  }, [toolResult, app]);

  const handleHeightChange = async (newHeight: number) => {
    // Clamp height to valid range
    const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
    
    if (clampedHeight === height) return;

    setLoading(true);
    try {
      // Send size change notification to host
      app.sendSizeChanged({ height: clampedHeight });
      const change = clampedHeight - height;
      setHeight(clampedHeight);
      setLastChange(change);
      setTimeout(() => setLastChange(null), 1000);
    } catch (err) {
      console.error("Failed to change size:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-8 bg-muted" style={{ height: `${height}px` }}>
      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Height Display */}
        <div className="relative mb-12">
          <div className="text-7xl font-light tabular-nums tracking-tighter text-foreground">
            {height}
          </div>
          <div className="text-xl text-muted-foreground mt-2 text-center">px</div>
          {lastChange !== null && (
            <span
              className={`absolute -right-12 top-3 text-sm font-medium text-muted-foreground`}
            >
              {lastChange > 0 ? `+${lastChange}` : lastChange}
            </span>
          )}
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {PRESET_HEIGHTS.map((presetHeight) => (
            <Button
              key={presetHeight}
              variant={height === presetHeight ? "default" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => handleHeightChange(presetHeight)}
              disabled={loading}
            >
              {presetHeight}px
            </Button>
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="mt-8 text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Updating size...
          </div>
        )}
      </div>


    </div>
  );
}
