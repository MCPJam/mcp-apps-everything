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
                  className="w-full text-left p-3 rounded-md border border-border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{item.title || `Item ${i + 1}`}</div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  {item.createdAt && (
                    <div className="text-xs text-muted-foreground mt-1.5">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {data.title && (
              <div className="font-medium text-base">{data.title}</div>
            )}
            {data.content && (
              <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{data.content}</div>
            )}
            {data.createdAt && (
              <div className="text-xs text-muted-foreground pt-3 border-t border-border">
                {new Date(data.createdAt).toLocaleString()}
              </div>
            )}
          </div>
        );
      } catch {
        return <pre className="whitespace-pre-wrap text-xs font-mono text-foreground">{content.text}</pre>;
      }
  };

  return (
    <div className="flex flex-col items-center min-h-[300px] p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-lg font-light text-foreground mb-2">Read Resources</div>
        <div className="text-xs text-muted-foreground max-w-md">
          Resources are identified by URIs. Enter a URI below to read its content.
        </div>
      </div>

      {/* Resource URI Input */}
      <div className="w-full max-w-lg mb-6">
        <div className="text-xs text-muted-foreground mb-2 px-1">Resource URI</div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchResource(uri)}
            placeholder="notes://all"
            className="font-mono flex-1"
          />
          <Button 
            onClick={() => fetchResource(uri)} 
            disabled={loading || !uri.trim()} 
            size="icon" 
            className="h-9 w-9"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Quick Access */}
      <div className="w-full max-w-lg mb-8">
        <div className="text-xs text-muted-foreground mb-2 px-1">Quick access</div>
        <div className="flex flex-wrap gap-2">
          {presetResources.map((preset) => {
            const Icon = preset.icon;
            return (
              <Button
                key={preset.uri}
                variant={uri === preset.uri ? "default" : "ghost"}
                size="sm"
                className="h-8"
                onClick={() => fetchResource(preset.uri)}
                disabled={loading}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {preset.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Response Area */}
      <div className="w-full max-w-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground px-1">Resource content</div>
          {response && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
              className="h-7 text-xs"
            >
              <Code className="h-3 w-3 mr-1" />
              {showRaw ? "Pretty" : "Raw JSON"}
            </Button>
          )}
        </div>

        <div className="min-h-[180px] max-h-[300px] overflow-auto p-4 rounded-md border border-border bg-muted/20">
          {loading && (
            <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Reading resource...
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}

          {!loading && !error && response && (
            showRaw ? (
              <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              formatContent(response)
            )
          )}

          {!loading && !error && !response && (
            <div className="flex flex-col items-center justify-center h-[180px] text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <div className="text-sm text-muted-foreground mb-1">No resource selected</div>
              <div className="text-xs text-muted-foreground/70">Enter a URI above to read a resource</div>
            </div>
          )}
        </div>
      </div>

      {/* Create Note (optional) */}
      {callTool && (
        <div className="w-full max-w-lg mt-6 pt-6 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2 px-1">Create new note</div>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNote()}
              placeholder="Note title..."
              disabled={creatingNote}
              className="flex-1"
            />
            <Button
              variant="ghost"
              onClick={createNote}
              disabled={creatingNote || !newNoteTitle.trim()}
              size="icon"
              className="h-9 w-9"
            >
              {creatingNote ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
