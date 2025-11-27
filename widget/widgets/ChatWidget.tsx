/**
 * Chat Widget - Demonstrates ui/message API
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, BarChart3, FileQuestion, RotateCcw, Check, X } from "lucide-react";

interface ChatWidgetProps {
  sendMessage: (text: string) => Promise<void>;
}

interface SentMessage {
  text: string;
  timestamp: Date;
  status: "sent" | "error";
}

const quickActions = [
  { label: "Analyze", message: "Please analyze the data shown above.", icon: BarChart3 },
  { label: "Explain", message: "Can you explain how this works?", icon: FileQuestion },
  { label: "Retry", message: "Please try that again with different parameters.", icon: RotateCcw },
  { label: "Yes", message: "Yes, please proceed.", icon: Check },
  { label: "No", message: "No, let's try something else.", icon: X },
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
    <div className="p-4 space-y-4">
      {/* Info Banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-800/50 p-4">
        <div className="font-semibold text-sm mb-1">Send messages to the chat</div>
        <div className="text-xs text-muted-foreground">
          Messages sent from this widget will appear in the conversation as user input.
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Quick Actions
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="rounded-full transition-all hover:scale-105"
                onClick={() => handleSendMessage(action.message)}
                disabled={sending}
                title={action.message}
              >
                <Icon className="h-3 w-3 mr-1.5" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Custom Message Input */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Custom Message
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(customMessage)}
            placeholder="Type a message..."
            disabled={sending}
            className="text-sm"
          />
          <Button
            onClick={() => handleSendMessage(customMessage)}
            disabled={sending || !customMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sent Messages History */}
      {sentMessages.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Sent Messages
          </div>
          <div className="space-y-2 max-h-[140px] overflow-auto">
            {sentMessages.slice(-3).map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border-l-2 bg-card ${
                  msg.status === "sent"
                    ? "border-l-green-500"
                    : "border-l-red-500"
                }`}
              >
                <div className="text-sm">{msg.text}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                  <span>{msg.timestamp.toLocaleTimeString()}</span>
                  <span>•</span>
                  <span className={msg.status === "sent" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                    {msg.status === "sent" ? "✓ Sent" : "✗ Failed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
