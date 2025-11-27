/**
 * Resource Explorer Widget - Teaches resources/read API
 *
 * Features:
 * - Interactive resource URI input
 * - Preset example URIs to explore
 * - Shows raw request/response
 * - Create notes to have data to browse
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ReadResourceResult, CallToolResult } from "../../shared/types";

interface ResourceExplorerProps {
  toolInput: { arguments: Record<string, unknown> } | null;
  readResource: (uri: string) => Promise<ReadResourceResult>;
  callTool?: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
}

const presetResources = [
  { uri: "notes://all", label: "All Notes", icon: "&#x1F4DA;" },
  { uri: "notes://note-1", label: "Note #1", icon: "&#x1F4C4;" },
  { uri: "notes://note-2", label: "Note #2", icon: "&#x1F4C4;" },
];

export function NotesWidget({ readResource, callTool }: ResourceExplorerProps) {
  const [uri, setUri] = useState("notes://all");
  const [response, setResponse] = useState<ReadResourceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [creatingNote, setCreatingNote] = useState(false);

  const fetchResource = async (resourceUri: string) => {
    setLoading(true);
    setError(null);
    setUri(resourceUri);

    try {
      const result = await readResource(resourceUri);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read resource");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!callTool || !newNoteTitle.trim()) return;
    setCreatingNote(true);
    try {
      await callTool("create-note", {
        title: newNoteTitle,
        content: `This note was created via tools/call to demonstrate how resources/read can fetch dynamically created content.`,
      });
      setNewNoteTitle("");
      // Refresh the notes list
      await fetchResource("notes://all");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setCreatingNote(false);
    }
  };

  const formatContent = (result: ReadResourceResult) => {
    const content = result.contents?.[0];
    if (!content) return null;

    try {
      const data = JSON.parse(content.text || "");
      if (Array.isArray(data)) {
        return (
          <div className="space-y-2">
            {data.map((item, i) => (
              <div
                key={i}
                onClick={() => item.id && fetchResource(`notes://${item.id}`)}
                className="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <div className="font-semibold">{item.title || `Item ${i + 1}`}</div>
                {item.createdAt && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      // Single object
      return (
        <div className="leading-relaxed">
          {data.title && (
            <div className="font-semibold text-lg mb-2">{data.title}</div>
          )}
          {data.content && (
            <div className="whitespace-pre-wrap">{data.content}</div>
          )}
          {data.createdAt && (
            <div className="text-xs text-muted-foreground mt-2">
              Created: {new Date(data.createdAt).toLocaleString()}
            </div>
          )}
        </div>
      );
    } catch {
      return <pre className="whitespace-pre-wrap text-sm">{content.text}</pre>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Enter URI */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-2">
          1&#xFE0F;&#x20E3; Enter a resource URI
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchResource(uri)}
            placeholder="notes://all"
            className="font-mono text-sm"
          />
          <Button onClick={() => fetchResource(uri)} disabled={loading}>
            {loading ? "&#x23F3;" : "&#x1F4D6;"} Read
          </Button>
        </div>
      </div>

      {/* Quick presets */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-2">
          2&#xFE0F;&#x20E3; Or try these examples
        </div>
        <div className="flex flex-wrap gap-2">
          {presetResources.map((preset) => (
            <Button
              key={preset.uri}
              variant={uri === preset.uri ? "default" : "outline"}
              size="sm"
              onClick={() => fetchResource(preset.uri)}
              disabled={loading}
            >
              <span dangerouslySetInnerHTML={{ __html: preset.icon }} /> {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Create a note */}
      {callTool && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            3&#xFE0F;&#x20E3; Create a note (uses tools/call, then refresh)
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNote()}
              placeholder="New note title..."
              disabled={creatingNote}
            />
            <Button
              variant="secondary"
              onClick={createNote}
              disabled={creatingNote || !newNoteTitle.trim()}
            >
              {creatingNote ? "&#x23F3;" : "&#x2795;"} Create
            </Button>
          </div>
        </div>
      )}

      {/* Response */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-semibold text-muted-foreground">
            &#x1F4EC; Response
          </div>
          {response && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
              className="h-6 text-xs"
            >
              {showRaw ? "Pretty" : "Raw JSON"}
            </Button>
          )}
        </div>

        <div className="p-3 bg-muted rounded-lg min-h-[100px] max-h-[200px] overflow-auto text-sm">
          {loading && (
            <div className="text-center text-muted-foreground">
              <div>Loading...</div>
              <div className="font-mono text-xs mt-1">
                readResource("{uri}")
              </div>
            </div>
          )}

          {error && (
            <div className="text-destructive">
              &#x26A0;&#xFE0F; {error}
            </div>
          )}

          {!loading && !error && response && (
            showRaw ? (
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              formatContent(response)
            )
          )}

          {!loading && !error && !response && (
            <div className="text-muted-foreground text-center">
              Click "Read" to fetch a resource
            </div>
          )}
        </div>

        {/* Request info */}
        {response && (
          <div className="mt-2 p-2 bg-secondary rounded text-xs font-mono text-muted-foreground">
            <div>&#x1F4E4; Request: resources/read</div>
            <div>&#x1F4CD; URI: {uri}</div>
            <div>&#x1F4E6; MIME: {response.contents?.[0]?.mimeType || "unknown"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
