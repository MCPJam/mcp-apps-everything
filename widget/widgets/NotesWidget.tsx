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
import type { ReadResourceResult, CallToolResult } from "../../shared/types";

interface ResourceExplorerProps {
  isDark: boolean;
  toolInput: { arguments: Record<string, unknown> } | null;
  readResource: (uri: string) => Promise<ReadResourceResult>;
  callTool?: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
}

const presetResources = [
  { uri: "notes://all", label: "All Notes", icon: "📚" },
  { uri: "notes://note-1", label: "Note #1", icon: "📄" },
  { uri: "notes://note-2", label: "Note #2", icon: "📄" },
];

export function NotesWidget({ isDark, readResource, callTool }: ResourceExplorerProps) {
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.map((item, i) => (
              <div
                key={i}
                onClick={() => item.id && fetchResource(`notes://${item.id}`)}
                style={{
                  padding: "0.75rem",
                  background: isDark ? "#333" : "#e5e5e5",
                  borderRadius: "6px",
                  cursor: item.id ? "pointer" : "default",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{item.title || `Item ${i + 1}`}</div>
                {item.createdAt && (
                  <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
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
        <div style={{ lineHeight: 1.6 }}>
          {data.title && <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.5rem" }}>{data.title}</div>}
          {data.content && <div style={{ whiteSpace: "pre-wrap" }}>{data.content}</div>}
          {data.createdAt && (
            <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.5rem" }}>
              Created: {new Date(data.createdAt).toLocaleString()}
            </div>
          )}
        </div>
      );
    } catch {
      return <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{content.text}</pre>;
    }
  };

  const inputStyle = {
    padding: "0.5rem",
    background: isDark ? "#222" : "#fff",
    color: isDark ? "#fff" : "#000",
    border: `1px solid ${isDark ? "#444" : "#ccc"}`,
    borderRadius: "4px",
    fontSize: "0.9rem",
  };

  const buttonStyle = (primary = false) => ({
    padding: "0.5rem 0.75rem",
    background: primary ? (isDark ? "#2563eb" : "#3b82f6") : isDark ? "#333" : "#eee",
    color: primary ? "#fff" : isDark ? "#fff" : "#000",
    border: `1px solid ${isDark ? "#555" : "#ccc"}`,
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
  });

  return (
    <div>
      {/* Step 1: Enter URI */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem", opacity: 0.7 }}>
          1️⃣ Enter a resource URI
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchResource(uri)}
            placeholder="notes://all"
            style={{ ...inputStyle, flex: 1, fontFamily: "monospace" }}
          />
          <button onClick={() => fetchResource(uri)} disabled={loading} style={buttonStyle(true)}>
            {loading ? "⏳" : "📖"} Read
          </button>
        </div>
      </div>

      {/* Quick presets */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem", opacity: 0.7 }}>
          2️⃣ Or try these examples
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {presetResources.map((preset) => (
            <button
              key={preset.uri}
              onClick={() => fetchResource(preset.uri)}
              disabled={loading}
              style={{
                ...buttonStyle(),
                opacity: uri === preset.uri ? 1 : 0.7,
                borderColor: uri === preset.uri ? (isDark ? "#2563eb" : "#3b82f6") : isDark ? "#555" : "#ccc",
              }}
            >
              {preset.icon} {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create a note */}
      {callTool && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem", opacity: 0.7 }}>
            3️⃣ Create a note (uses tools/call, then refresh)
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNote()}
              placeholder="New note title..."
              disabled={creatingNote}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={createNote}
              disabled={creatingNote || !newNoteTitle.trim()}
              style={buttonStyle()}
            >
              {creatingNote ? "⏳" : "➕"} Create
            </button>
          </div>
        </div>
      )}

      {/* Response */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.7 }}>
            📬 Response
          </div>
          {response && (
            <button
              onClick={() => setShowRaw(!showRaw)}
              style={{ ...buttonStyle(), fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
            >
              {showRaw ? "Pretty" : "Raw JSON"}
            </button>
          )}
        </div>

        <div
          style={{
            padding: "0.75rem",
            background: isDark ? "#222" : "#f5f5f5",
            borderRadius: "6px",
            minHeight: "100px",
            maxHeight: "200px",
            overflow: "auto",
            fontSize: "0.85rem",
          }}
        >
          {loading && (
            <div style={{ textAlign: "center", opacity: 0.7 }}>
              <div>Loading...</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.75rem", marginTop: "0.5rem" }}>
                readResource("{uri}")
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: isDark ? "#fca5a5" : "#dc2626" }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && response && (
            showRaw ? (
              <pre style={{ margin: 0, fontSize: "0.75rem", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              formatContent(response)
            )
          )}

          {!loading && !error && !response && (
            <div style={{ opacity: 0.5, textAlign: "center" }}>
              Click "Read" to fetch a resource
            </div>
          )}
        </div>

        {/* Request info */}
        {response && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              background: isDark ? "#1a1a1a" : "#e5e5e5",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "0.7rem",
              opacity: 0.8,
            }}
          >
            <div>📤 Request: resources/read</div>
            <div>📍 URI: {uri}</div>
            <div>📦 MIME: {response.contents?.[0]?.mimeType || "unknown"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
