/**
 * Notes Widget - Demonstrates resources/read API
 *
 * Features:
 * - Reads MCP resources via resources/read
 * - Lists available notes from a resource
 * - Shows resource content
 */

import { useState, useEffect } from "react";
import type { ReadResourceResult } from "../../shared/types";

interface NotesWidgetProps {
  isDark: boolean;
  toolInput: { arguments: Record<string, unknown> } | null;
  readResource: (uri: string) => Promise<ReadResourceResult>;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export function NotesWidget({ isDark, toolInput, readResource }: NotesWidgetProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourceUri, setResourceUri] = useState<string>("notes://all");

  // Load notes from resource
  const loadNotes = async (uri: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await readResource(uri);
      if (result.contents?.[0]?.text) {
        const data = JSON.parse(result.contents[0].text);
        if (Array.isArray(data)) {
          setNotes(data);
        } else if (data.notes) {
          setNotes(data.notes);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  // Load a single note
  const loadNote = async (noteId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await readResource(`notes://${noteId}`);
      if (result.contents?.[0]?.text) {
        const note = JSON.parse(result.contents[0].text);
        setSelectedNote(note);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load note");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadNotes(resourceUri);
  }, []);

  const buttonStyle = {
    padding: "0.4rem 0.8rem",
    background: isDark ? "#333" : "#eee",
    color: isDark ? "#fff" : "#000",
    border: `1px solid ${isDark ? "#555" : "#ccc"}`,
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
  };

  const noteItemStyle = (isSelected: boolean) => ({
    padding: "0.5rem",
    marginBottom: "0.25rem",
    background: isSelected ? (isDark ? "#2563eb" : "#3b82f6") : isDark ? "#222" : "#f5f5f5",
    color: isSelected ? "#fff" : isDark ? "#fff" : "#000",
    borderRadius: "4px",
    cursor: "pointer",
  });

  return (
    <div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", opacity: 0.7 }}>
        resources/read Demo
      </h3>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            type="text"
            value={resourceUri}
            onChange={(e) => setResourceUri(e.target.value)}
            placeholder="Resource URI (e.g., notes://all)"
            style={{
              flex: 1,
              padding: "0.4rem",
              background: isDark ? "#222" : "#fff",
              color: isDark ? "#fff" : "#000",
              border: `1px solid ${isDark ? "#444" : "#ccc"}`,
              borderRadius: "4px",
            }}
          />
          <button onClick={() => loadNotes(resourceUri)} disabled={loading} style={buttonStyle}>
            {loading ? "..." : "Load"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "0.5rem",
            marginBottom: "0.5rem",
            background: isDark ? "#7f1d1d" : "#fef2f2",
            color: isDark ? "#fca5a5" : "#b91c1c",
            borderRadius: "4px",
            fontSize: "0.85rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Notes List */}
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            Notes ({notes.length})
          </div>
          <div style={{ maxHeight: "200px", overflow: "auto" }}>
            {notes.length === 0 ? (
              <div style={{ opacity: 0.6, fontSize: "0.85rem" }}>
                {loading ? "Loading..." : "No notes found"}
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => loadNote(note.id)}
                  style={noteItemStyle(selectedNote?.id === note.id)}
                >
                  <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{note.title}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                    {new Date(note.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Note Content */}
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            Content
          </div>
          <div
            style={{
              padding: "0.5rem",
              background: isDark ? "#222" : "#f5f5f5",
              borderRadius: "4px",
              minHeight: "150px",
              fontSize: "0.85rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {selectedNote ? (
              <>
                <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                  {selectedNote.title}
                </div>
                {selectedNote.content}
              </>
            ) : (
              <span style={{ opacity: 0.6 }}>Select a note to view</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
