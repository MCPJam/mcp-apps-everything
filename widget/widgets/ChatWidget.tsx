/**
 * Chat Widget - Demonstrates ui/message API
 *
 * Features:
 * - Sends messages to the chat via ui/message
 * - Provides quick action buttons
 * - Shows message history
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
  { label: "📊 Analyze this", message: "Please analyze the data shown in the widget above." },
  { label: "📝 Summarize", message: "Can you summarize what we've discussed so far?" },
  { label: "🔄 Refresh data", message: "Please refresh the data and show me the latest results." },
  { label: "❓ Help", message: "I need help understanding how to use this feature." },
  { label: "✅ Confirm", message: "Yes, please proceed with that action." },
  { label: "❌ Cancel", message: "No, please cancel and show me other options." },
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
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", opacity: 0.7 }}>
        ui/message Demo
      </h3>

      {/* Quick Actions */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
          Quick Actions:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleSendMessage(action.message)}
              disabled={sending}
              style={buttonStyle()}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Message */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
          Custom Message:
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(customMessage)}
            placeholder="Type your message..."
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
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>

      {/* Sent Messages History */}
      {sentMessages.length > 0 && (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            Sent Messages:
          </div>
          <div
            style={{
              maxHeight: "150px",
              overflow: "auto",
              background: isDark ? "#222" : "#f5f5f5",
              borderRadius: "4px",
              padding: "0.5rem",
            }}
          >
            {sentMessages.slice(-5).map((msg, i) => (
              <div
                key={i}
                style={{
                  padding: "0.5rem",
                  marginBottom: "0.25rem",
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
                  {msg.timestamp.toLocaleTimeString()} - {msg.status === "sent" ? "✓ Sent" : "✗ Failed"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
