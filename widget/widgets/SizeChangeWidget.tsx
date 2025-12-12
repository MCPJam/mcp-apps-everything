/**
 * Size Change Widget - Demonstrates ui/notifications/size-change API
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
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
  const [lastChange, setLastChange] = useState<number | null>(null);
  const [autoResize, setAutoResize] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (toolInput?.arguments?.height !== undefined) {
      const inputHeight = toolInput.arguments.height as number;
      const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, inputHeight));
      setHeight(clampedHeight);
    }
  }, [toolInput]);

  useEffect(() => {
    if (toolResult?.structuredContent?.height !== undefined) {
      const resultHeight = toolResult.structuredContent.height as number;
      const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resultHeight));
      setHeight(clampedHeight);
    }
  }, [toolResult]);

  // Auto resize effect
  useEffect(() => {
    if (!autoResize || !contentRef.current) return;

    const updateHeight = () => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, contentHeight));
        setHeight(newHeight);
      }
    };

    // Initial height calculation
    updateHeight();

    // Set up ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [autoResize]);

  const handleHeightChange = (newHeight: number) => {
    // Clamp height to valid range
    const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
    
    if (clampedHeight === height) return;

    const change = clampedHeight - height;
    setHeight(clampedHeight);
    setLastChange(change);
    setTimeout(() => setLastChange(null), 1000);
  };

  return (
    <div className="flex flex-col p-8 bg-muted" style={{ minHeight: `${height}px` }}>
      {/* Auto Resize Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm font-medium">Auto Resize</div>
        <Button
          variant={autoResize ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoResize(!autoResize)}
        >
          {autoResize ? "ON" : "OFF"}
        </Button>
      </div>

      {/* Main content - centered */}
      <div ref={contentRef} className="flex-1 flex flex-col items-center justify-center">
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

        {/* Preset Buttons - disabled when auto resize is on */}
        <div className="flex flex-wrap gap-2 justify-center">
          {PRESET_HEIGHTS.map((presetHeight) => (
            <Button
              key={presetHeight}
              variant={height === presetHeight ? "default" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => !autoResize && handleHeightChange(presetHeight)}
              disabled={autoResize}
            >
              {presetHeight}px
            </Button>
          ))}
        </div>
      </div>


    </div>
  );
}
