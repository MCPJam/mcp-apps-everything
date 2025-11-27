/**
 * Notes Widget - Demonstrates resources/read API
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, FileText, Plus, RefreshCw, Code, ChevronRight } from "lucide-react";
import type { ReadResourceResult, CallToolResult } from "../../shared/types";

interface NotesWidgetProps {
  toolInput: { arguments: Record<string, unknown> } | null;
  readResource: (uri: string) => Promise<ReadResourceResult>;
  callTool?: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
}

const presetResources = [
  { uri: "notes://all", label: "All Notes", icon: BookOpen },
  { uri: "notes://note-1", label: "Note 1", icon: FileText },
  { uri: "notes://note-2", label: "Note 2", icon: FileText },
];

export function NotesWidget({ readResource, callTool }: NotesWidgetProps) {
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
        content: `Note created via tools/call API.`,
      });
      setNewNoteTitle("");
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
              <button
                key={i}
                onClick={() => item.id && fetchResource(`notes://${item.id}`)}
                className="w-full text-left p-3 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{item.title || `Item ${i + 1}`}</div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {item.createdAt && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                )}
              </button>
            ))}
          </div>
        );
      }
      return (
        <div className="p-4 rounded-lg bg-card border border-border">
          {data.title && (
            <div className="font-semibold text-lg mb-2">{data.title}</div>
          )}
          {data.content && (
            <div className="text-muted-foreground whitespace-pre-wrap">{data.content}</div>
          )}
          {data.createdAt && (
            <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              Created {new Date(data.createdAt).toLocaleString()}
            </div>
          )}
        </div>
      );
    } catch {
      return <pre className="whitespace-pre-wrap text-sm p-4 bg-card rounded-lg">{content.text}</pre>;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
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
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
        </Button>
      </div>

      {/* Quick Access */}
      <div className="flex flex-wrap gap-2">
        {presetResources.map((preset) => {
          const Icon = preset.icon;
          return (
            <Button
              key={preset.uri}
              variant={uri === preset.uri ? "default" : "outline"}
              size="sm"
              className="rounded-full transition-all hover:scale-105"
              onClick={() => fetchResource(preset.uri)}
              disabled={loading}
            >
              <Icon className="h-3 w-3 mr-1.5" />
              {preset.label}
            </Button>
          );
        })}
      </div>

      {/* Create Note */}
      {callTool && (
        <div className="flex gap-2">
          <Input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createNote()}
            placeholder="New note title..."
            disabled={creatingNote}
            className="text-sm"
          />
          <Button
            variant="secondary"
            onClick={createNote}
            disabled={creatingNote || !newNoteTitle.trim()}
          >
            {creatingNote ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Response Area */}
      <div className="rounded-xl bg-muted/50 border border-border overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
          <span className="text-xs font-medium text-muted-foreground">Response</span>
          {response && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
              className="h-6 text-xs gap-1"
            >
              <Code className="h-3 w-3" />
              {showRaw ? "Pretty" : "JSON"}
            </Button>
          )}
        </div>

        <div className="p-3 min-h-[120px] max-h-[200px] overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-[100px] text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {!loading && !error && response && (
            showRaw ? (
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              formatContent(response)
            )
          )}

          {!loading && !error && !response && (
            <div className="flex items-center justify-center h-[100px] text-muted-foreground text-sm">
              Select a resource to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
