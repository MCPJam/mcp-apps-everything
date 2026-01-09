/**
 * Read Resource Widget - Demonstrates resources/read API
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";

interface Resource {
  id: string;
  title: string;
  content: string;
}

interface AvailableResource {
  id: string;
  title: string;
}

interface ReadResourceWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

export function ReadResourceWidget({ app, toolResult }: ReadResourceWidgetProps) {
  const [availableResources, setAvailableResources] = useState<AvailableResource[]>([]);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (toolResult?.structuredContent?.availableTips) {
      setAvailableResources(toolResult.structuredContent.availableTips as AvailableResource[]);
    }
  }, [toolResult]);

  const fetchResource = async (resourceId: string) => {
    setLoading(true);
    setSelectedId(resourceId);

    try {
      // Read the resource directly via the SDK
      const result = await (app as any).readServerResource({ uri: `tips://${resourceId}` });
      const textContent = result?.contents?.[0]?.text;

      if (textContent) {
        const resource = JSON.parse(textContent);
        setCurrentResource(resource);
      }
    } catch (err) {
      console.error("Failed to read resource:", err);
    } finally {
      setLoading(false);
    }
  };

  if (availableResources.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      {/* Content Display */}
      <div className="flex-1 flex flex-col items-center justify-center mb-12">
        {loading && (
          <div className="text-sm text-muted-foreground animate-pulse">
            Reading...
          </div>
        )}

        {!loading && currentResource && (
          <>
            <div className="text-2xl font-light text-foreground mb-4 text-center">
              {currentResource.title}
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed text-center max-w-md mb-4">
              {currentResource.content}
            </div>
            <div className="text-xs text-muted-foreground/50 font-mono">
              tips://{currentResource.id}
            </div>
          </>
        )}

        {!loading && !currentResource && (
          <div className="text-sm text-muted-foreground">
            Select a topic to read
          </div>
        )}
      </div>

      {/* Topic Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {availableResources.map((resource) => (
          <Button
            key={resource.id}
            variant={selectedId === resource.id ? "default" : "ghost"}
            size="sm"
            className="h-8"
            onClick={() => fetchResource(resource.id)}
            disabled={loading}
          >
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            {resource.title}
          </Button>
        ))}
      </div>
    </div>
  );
}
