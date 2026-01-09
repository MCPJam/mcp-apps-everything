/**
 * Host Context Widget - Comprehensive display of all host context fields
 *
 * Demonstrates SEP-1865 host-context-changed notification with ALL fields.
 * Shows real-time updates with visual change indicators and a change log.
 */

import { useState, useEffect, useRef } from "react";
import {
  Palette,
  Globe,
  Clock,
  Monitor,
  Maximize2,
  Smartphone,
  Mouse,
  Layout,
  Info,
  RefreshCw,
} from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps/react";
import type { ComponentType } from "react";

interface HostContextWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
  hostContext: McpUiHostContext | null;
}

interface HostContext {
  theme?: string;
  locale?: string;
  timeZone?: string;
  displayMode?: string;
  viewport?: {
    width: number;
    height: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  platform?: string;
  deviceCapabilities?: {
    touch?: boolean;
    hover?: boolean;
  };
  safeAreaInsets?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  userAgent?: string;
  toolInfo?: {
    id?: string;
    tool?: { name?: string };
  };
}

interface ChangeEvent {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

export function HostContextWidget({ app, hostContext }: HostContextWidgetProps) {
  // Use hostContext prop from App.tsx - this avoids conflicting with App.tsx's notification handler
  const context = (hostContext ?? {}) as HostContext;
  const prevContextRef = useRef<HostContext>(context);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const [changeLog, setChangeLog] = useState<ChangeEvent[]>([]);

  // Track changes when hostContext prop updates
  useEffect(() => {
    const prev = prevContextRef.current;
    const changes: ChangeEvent[] = [];
    const updatedFields = new Set<string>();

    // Track all changed fields
    Object.keys(context).forEach((key) => {
      if (
        context[key as keyof HostContext] !== undefined &&
        JSON.stringify(prev[key as keyof HostContext]) !==
          JSON.stringify(context[key as keyof HostContext])
      ) {
        changes.push({
          field: key,
          oldValue: prev[key as keyof HostContext],
          newValue: context[key as keyof HostContext],
          timestamp: Date.now(),
        });
        updatedFields.add(key);
      }
    });

    if (changes.length > 0) {
      setChangeLog((prevLog) => [...changes, ...prevLog].slice(0, 10));
      setChangedFields(updatedFields);
      setTimeout(() => setChangedFields(new Set()), 2000);
    }

    prevContextRef.current = context;
  }, [context]);

  // Helper to render field with change indicator
  const FieldRow = ({
    label,
    value,
    fieldKey,
    icon: Icon,
  }: {
    label: string;
    value: unknown;
    fieldKey: string;
    icon: ComponentType<{ className?: string }>;
  }) => {
    const isChanged = changedFields.has(fieldKey);
    const displayValue =
      value === undefined
        ? "Not set"
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

    return (
      <div
        className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
          isChanged ? "bg-primary/10 ring-2 ring-primary" : "bg-muted/30"
        }`}
      >
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground">
            {label}
          </div>
          <div className="text-sm font-mono break-all">{displayValue}</div>
        </div>
        {isChanged && <RefreshCw className="h-3 w-3 text-primary animate-spin" />}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-[500px] p-6">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-light mb-2">Host Context</h2>
        <p className="text-sm text-muted-foreground">
          All fields update in real-time when changed in inspector
        </p>
      </div>

      {/* Context Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <FieldRow label="Theme" value={context.theme} fieldKey="theme" icon={Palette} />
        <FieldRow label="Locale" value={context.locale} fieldKey="locale" icon={Globe} />
        <FieldRow
          label="Timezone"
          value={context.timeZone}
          fieldKey="timeZone"
          icon={Clock}
        />
        <FieldRow
          label="Display Mode"
          value={context.displayMode}
          fieldKey="displayMode"
          icon={Monitor}
        />
        <FieldRow
          label="Platform"
          value={context.platform}
          fieldKey="platform"
          icon={Smartphone}
        />
        <FieldRow
          label="User Agent"
          value={context.userAgent}
          fieldKey="userAgent"
          icon={Info}
        />
      </div>

      {/* Complex Objects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <FieldRow
          label="Viewport"
          value={context.viewport}
          fieldKey="viewport"
          icon={Maximize2}
        />
        <FieldRow
          label="Device Capabilities"
          value={context.deviceCapabilities}
          fieldKey="deviceCapabilities"
          icon={Mouse}
        />
        <FieldRow
          label="Safe Area Insets"
          value={context.safeAreaInsets}
          fieldKey="safeAreaInsets"
          icon={Layout}
        />
        <FieldRow
          label="Tool Info"
          value={
            context.toolInfo
              ? { id: context.toolInfo.id, toolName: context.toolInfo.tool?.name }
              : undefined
          }
          fieldKey="toolInfo"
          icon={Info}
        />
      </div>

      {/* Change Log */}
      {changeLog.length > 0 && (
        <div className="mt-auto pt-4 border-t border-border">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Recent Changes
          </h3>
          <div className="space-y-1 max-h-32 overflow-auto">
            {changeLog.slice(0, 5).map((change, i) => (
              <div key={i} className="text-xs text-muted-foreground font-mono">
                <span className="text-primary">{change.field}</span>
                {": "}
                <span className="line-through opacity-50">
                  {JSON.stringify(change.oldValue)}
                </span>
                {" → "}
                <span>{JSON.stringify(change.newValue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
