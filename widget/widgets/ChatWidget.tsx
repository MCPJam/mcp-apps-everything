/**
 * Chat Widget - Demonstrates ui/message API
 *
 * Features:
 * - Sends follow-up messages to the AI chat
 * - Shows how widgets can drive conversation
 * - Best used in Playground mode
 */

import { useState } from "react";

interface ChatWidgetProps {
  isDark: boolean;
  sendMessage: (text: string) => Promise<void>;
}

interface SentMessage {
  text: string;
  timestamp: Date;
  status: "sent" | "error";
}

const quickActions = [
  { label: "📊 Analyze", message: "Please analyze the data shown above." },
  { label: "📝 Explain", message: "Can you explain how this works?" },
  { label: "🔄 Retry", message: "Please try that again with different parameters." },
  { label: "✅ Yes", message: "Yes, please proceed." },
  { label: "❌ No", message: "No, let's try something else." },
];

export function ChatWidget({ isDark, sendMessage }: ChatWidgetProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [sending, setSending] = useState(false);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setSending(true);
    try {
      await sendMessage(text);
      setSentMessages((prev) => [
        ...prev,
        { text, timestamp: new Date(), status: "sent" },
      ]);
      setCustomMessage("");
    } catch (err) {
      setSentMessages((prev) => [
        ...prev,
        { text, timestamp: new Date(), status: "error" },
      ]);
    } finally {
      setSending(false);
    }
  };

  const buttonStyle = (primary = false) => ({
    padding: "0.5rem 0.75rem",
    background: primary
      ? isDark
        ? "#2563eb"
        : "#3b82f6"
      : isDark
      ? "#333"
      : "#eee",
    color: primary ? "#fff" : isDark ? "#fff" : "#000",
    border: `1px solid ${isDark ? "#555" : "#ccc"}`,
    borderRadius: "4px",
    cursor: sending ? "wait" : "pointer",
    fontSize: "0.85rem",
    opacity: sending ? 0.6 : 1,
  });

  return (
    <div>
      {/* Educational Banner */}
      <div
        style={{
          padding: "0.75rem",
          background: isDark ? "#1e3a5f" : "#dbeafe",
          borderRadius: "8px",
          marginBottom: "1rem",
          border: `1px solid ${isDark ? "#2563eb" : "#93c5fd"}`,
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
          💡 Best used in Playground
        </div>
        <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
          This widget lets tools send <strong>follow-up messages</strong> to the AI.
          Try it in the Playground tab to see messages appear in the chat!
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem", opacity: 0.7 }}>
          How it works
        </div>
        <div
          style={{
            padding: "0.5rem 0.75rem",
            background: isDark ? "#222" : "#f5f5f5",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "0.75rem",
          }}
        >
          <div>1. User clicks a button or types a message</div>
          <div>2. Widget calls <code style={{ background: isDark ? "#333" : "#e5e5e5", padding: "0 0.25rem", borderRadius: "2px" }}>ui/message</code></div>
          <div>3. Message appears in chat as user input</div>
          <div>4. AI responds to the new message</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem", opacity: 0.7 }}>
          Quick responses (click to send)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleSendMessage(action.message)}
              disabled={sending}
              style={buttonStyle()}
              title={action.message}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Message */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem", opacity: 0.7 }}>
          Or type a custom message
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(customMessage)}
            placeholder="Type your follow-up message..."
            disabled={sending}
            style={{
              flex: 1,
              padding: "0.5rem",
              background: isDark ? "#222" : "#fff",
              color: isDark ? "#fff" : "#000",
              border: `1px solid ${isDark ? "#444" : "#ccc"}`,
              borderRadius: "4px",
            }}
          />
          <button
            onClick={() => handleSendMessage(customMessage)}
            disabled={sending || !customMessage.trim()}
            style={buttonStyle(true)}
          >
            {sending ? "⏳" : "📤"} Send
          </button>
        </div>
      </div>

      {/* Sent Messages */}
      {sentMessages.length > 0 && (
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem", opacity: 0.7 }}>
            Messages sent via ui/message
          </div>
          <div
            style={{
              maxHeight: "100px",
              overflow: "auto",
              background: isDark ? "#222" : "#f5f5f5",
              borderRadius: "6px",
              padding: "0.5rem",
            }}
          >
            {sentMessages.slice(-3).map((msg, i) => (
              <div
                key={i}
                style={{
                  padding: "0.5rem",
                  marginBottom: i < sentMessages.length - 1 ? "0.25rem" : 0,
                  background: isDark ? "#333" : "#fff",
                  borderRadius: "4px",
                  borderLeft: `3px solid ${
                    msg.status === "sent"
                      ? isDark
                        ? "#22c55e"
                        : "#16a34a"
                      : isDark
                      ? "#ef4444"
                      : "#dc2626"
                  }`,
                }}
              >
                <div style={{ fontSize: "0.85rem" }}>{msg.text}</div>
                <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.25rem" }}>
                  {msg.timestamp.toLocaleTimeString()} • {msg.status === "sent" ? "✓ Sent to chat" : "✗ Failed"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
