/**
 * Open Link Widget - Demonstrates ui/open-link API
 */

import { useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps/react";

interface OpenLinkWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

const LINKS = [
  {
    url: "https://mcpjam.com",
    label: "MCPJam",
    description: "The Official MCPJam Inspector Website"
  },
  {
    url: "https://mcpui.dev", 
    label: "MCP UI",
    description: "MCP Apps documentation and resources"
  },
  {
    url: "https://modelcontextprotocol.io",
    label: "Model Context Protocol", 
    description: "Official MCP documentation and guides"
  },
  {
    url: "https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/draft/apps.mdx",
    label: "SEP-1865 Specification",
    description: "Technical specification for MCP Apps"
  }
];

export function OpenLinkWidget({ app }: OpenLinkWidgetProps) {
  const [linkOpened, setLinkOpened] = useState<string | null>(null);

  const handleOpenLink = async (url: string, label: string) => {
    try {
      await app.sendOpenLink({ url });
      setLinkOpened(label);
      setTimeout(() => setLinkOpened(null), 2000);
    } catch (err) {
      console.error("Failed to open link:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold mb-2">MCP Resources</h1>
        <p className="text-muted-foreground">
          Explore these MCP-related resources and documentation
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {LINKS.map((link) => (
          <div
            key={link.url}
            className="flex flex-col p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => handleOpenLink(link.url, link.label)}
          >
            <div className="flex-1">
              <h3 className="font-medium mb-1">{link.label}</h3>
              <p className="text-sm text-muted-foreground">{link.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Success Toast */}
      {linkOpened && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-foreground text-background rounded-md text-xs shadow-lg border border-border">
          Opened {linkOpened}
        </div>
      )}
    </div>
  );
}
