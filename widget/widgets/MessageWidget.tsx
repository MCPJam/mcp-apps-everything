/**
 * Message Widget - Demonstrates ui/message API
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";

interface MessageWidgetProps {
  sendMessage: (text: string) => Promise<void>;
}

const suggestions = [
  { label: "What's MCP?", message: "What's MCP?" },
  { label: "Tell me a joke", message: "Tell me a funny joke about programming." },
];

export function MessageWidget({ sendMessage }: MessageWidgetProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (text: string) => {
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(text);
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 gap-4">
      {/* Input Container */}
      <div className="flex gap-2 w-full max-w-md items-end">
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(message)}
            placeholder="Type a message..."
            disabled={sending}
            className="h-12 rounded-full px-5 pr-12 text-sm border-2 border-border/60 bg-background shadow-sm focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all disabled:opacity-60"
          />
        </div>
        <Button
          onClick={() => handleSend(message)}
          disabled={sending || !message.trim()}
          size="icon"
          className="h-12 w-12 rounded-full shrink-0 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 flex-wrap justify-center">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => handleSend(s.message)}
            disabled={sending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full border border-border/60 bg-muted/50 hover:bg-muted hover:border-border transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs hover:shadow-sm active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
