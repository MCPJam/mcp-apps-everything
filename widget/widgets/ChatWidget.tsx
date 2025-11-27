/**
 * Chat Widget - Demonstrates ui/message API
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, FileQuestion, Sparkles } from "lucide-react";

interface ChatWidgetProps {
  sendMessage: (text: string) => Promise<void>;
}

interface SentMessage {
  text: string;
  timestamp: Date;
  status: "sent" | "error";
}

const quickActions = [
  { label: "What's MCP?", message: "What's MCP?", icon: FileQuestion },
  { label: "Tell me a joke", message: "Tell me a funny joke about programming.", icon: Sparkles },
];

export function ChatWidget({ sendMessage }: ChatWidgetProps) {
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
    } catch {
      setSentMessages((prev) => [
        ...prev,
        { text, timestamp: new Date(), status: "error" },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      {/* Custom Message Input */}
      <div className="flex gap-2 mb-8 w-full max-w-md">
        <Input
          type="text"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage(customMessage)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1"
        />
        <Button
          onClick={() => handleSendMessage(customMessage)}
          disabled={sending || !customMessage.trim()}
          size="icon"
          className="h-9 w-9"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => handleSendMessage(action.message)}
              disabled={sending}
              title={action.message}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {action.label}
            </Button>
          );
        })}
      </div>

      {/* Sent Messages History */}
      {sentMessages.length > 0 && (
        <div className="w-full max-w-md space-y-2">
          {sentMessages.slice(-3).map((msg, i) => (
            <div
              key={i}
              className="p-3 rounded-md bg-muted/30 border border-border"
            >
              <div className="text-sm text-foreground">{msg.text}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <span>{msg.timestamp.toLocaleTimeString()}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className={msg.status === "sent" ? "text-foreground/60" : "text-destructive"}>
                  {msg.status === "sent" ? "Sent" : "Failed"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
