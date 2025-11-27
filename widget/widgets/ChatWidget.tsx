/**
 * Chat Widget - Demonstrates ui/message API
 *
 * Features:
 * - Sends follow-up messages to the AI chat
 * - Shows how widgets can drive conversation
 * - Best used in Playground mode
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

interface ChatWidgetProps {
  sendMessage: (text: string) => Promise<void>;
}

interface SentMessage {
  text: string;
  timestamp: Date;
  status: "sent" | "error";
}

const quickActions = [
  { label: "&#x1F4CA; Analyze", message: "Please analyze the data shown above." },
  { label: "&#x1F4DD; Explain", message: "Can you explain how this works?" },
  { label: "&#x1F504; Retry", message: "Please try that again with different parameters." },
  { label: "&#x2705; Yes", message: "Yes, please proceed." },
  { label: "&#x274C; No", message: "No, let's try something else." },
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
    <div className="space-y-4">
      {/* Educational Banner */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardContent className="p-3">
          <div className="font-semibold text-sm mb-1">
            &#x1F4A1; Best used in Playground
          </div>
          <div className="text-xs text-muted-foreground">
            This widget lets tools send <strong>follow-up messages</strong> to the AI.
            Try it in the Playground tab to see messages appear in the chat!
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-2">
          How it works
        </div>
        <div className="p-3 bg-muted rounded-lg font-mono text-xs space-y-1">
          <div>1. User clicks a button or types a message</div>
          <div>2. Widget calls <code className="bg-secondary px-1 rounded">ui/message</code></div>
          <div>3. Message appears in chat as user input</div>
          <div>4. AI responds to the new message</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-2">
          Quick responses (click to send)
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => handleSendMessage(action.message)}
              disabled={sending}
              title={action.message}
            >
              <span dangerouslySetInnerHTML={{ __html: action.label }} />
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Message */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-2">
          Or type a custom message
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(customMessage)}
            placeholder="Type your follow-up message..."
            disabled={sending}
          />
          <Button
            onClick={() => handleSendMessage(customMessage)}
            disabled={sending || !customMessage.trim()}
          >
            <Send className="size-4" />
            Send
          </Button>
        </div>
      </div>

      {/* Sent Messages */}
      {sentMessages.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            Messages sent via ui/message
          </div>
          <div className="max-h-[100px] overflow-auto bg-muted rounded-lg p-2 space-y-2">
            {sentMessages.slice(-3).map((msg, i) => (
              <div
                key={i}
                className={`p-2 bg-card rounded border-l-3 ${
                  msg.status === "sent"
                    ? "border-l-green-500"
                    : "border-l-red-500"
                }`}
              >
                <div className="text-sm">{msg.text}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {msg.timestamp.toLocaleTimeString()} &#x2022; {msg.status === "sent" ? "&#x2713; Sent to chat" : "&#x2717; Failed"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
