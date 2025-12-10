/**
 * Locale & Timezone Widget - Tests locale and timezone from host context
 *
 * Demonstrates SEP-1865 host-context-changed notification with locale/timezone.
 * Formats dates, times, numbers, and currency using Intl APIs.
 */

import { useState, useEffect } from "react";
import { Globe, Clock, Calendar, Hash, RefreshCw } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";
import { McpUiHostContextChangedNotificationSchema } from "@modelcontextprotocol/ext-apps/react";

interface LocaleTimezoneWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

interface LocaleContext {
  locale?: string;
  timeZone?: string;
}

export function LocaleTimezoneWidget({ app }: LocaleTimezoneWidgetProps) {
  const [context, setContext] = useState<LocaleContext>({
    locale: undefined,
    timeZone: undefined,
  });
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Subscribe to host context changes
  useEffect(() => {
    app.setNotificationHandler(
      McpUiHostContextChangedNotificationSchema,
      (notification) => {
        const params = notification.params;
        setContext((prev) => {
          const updated = { ...prev };
          if (params.locale !== undefined) {
            updated.locale = params.locale as string;
            setLastChanged("locale");
          }
          if (params.timeZone !== undefined) {
            updated.timeZone = params.timeZone as string;
            setLastChanged("timeZone");
          }
          return updated;
        });
        // Clear change indicator after animation
        setTimeout(() => setLastChanged(null), 2000);
      }
    );
  }, [app]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Format helpers using Intl APIs
  const formatDate = (date: Date) => {
    try {
      return new Intl.DateTimeFormat(context.locale || "en-US", {
        dateStyle: "full",
        timeZone: context.timeZone,
      }).format(date);
    } catch {
      return date.toDateString();
    }
  };

  const formatTime = (date: Date) => {
    try {
      return new Intl.DateTimeFormat(context.locale || "en-US", {
        timeStyle: "long",
        timeZone: context.timeZone,
      }).format(date);
    } catch {
      return date.toTimeString();
    }
  };

  const formatNumber = (num: number) => {
    try {
      return new Intl.NumberFormat(context.locale || "en-US").format(num);
    } catch {
      return num.toString();
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    try {
      return new Intl.NumberFormat(context.locale || "en-US", {
        style: "currency",
        currency,
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* Current Settings Display */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 transition-all duration-300 ${
              lastChanged === "locale" ? "ring-2 ring-primary bg-primary/10" : ""
            }`}
          >
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-medium">
              {context.locale || "Not set"}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 transition-all duration-300 ${
              lastChanged === "timeZone" ? "ring-2 ring-primary bg-primary/10" : ""
            }`}
          >
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-medium">
              {context.timeZone || "Not set"}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Change locale/timezone in inspector to see updates
        </p>
      </div>

      {/* Formatted Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Date & Time */}
        <div className="p-4 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Date & Time</span>
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Date: </span>
              <span className="font-medium">{formatDate(currentTime)}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Time: </span>
              <span className="font-medium">{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>

        {/* Numbers */}
        <div className="p-4 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Numbers</span>
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Large: </span>
              <span className="font-medium">{formatNumber(1234567.89)}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Currency: </span>
              <span className="font-medium">{formatCurrency(9999.99)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change indicator */}
      {lastChanged && (
        <div className="mt-8 flex items-center gap-2 text-xs text-primary animate-pulse">
          <RefreshCw className="h-3 w-3" />
          <span>{lastChanged} updated</span>
        </div>
      )}
    </div>
  );
}
