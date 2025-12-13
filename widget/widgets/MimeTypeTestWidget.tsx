/**
 * MIME Type Test Widget - Tests SEP-1865 MIME type validation
 *
 * Tests various MIME type scenarios:
 * - Correct: text/html;profile=mcp-app
 * - Missing: no mimeType specified
 * - Wrong: text/html, text/html+mcp, application/octet-stream
 */

import type { App } from "@modelcontextprotocol/ext-apps/react";
import { CheckCircle2, XCircle, AlertTriangle, FileType } from "lucide-react";

interface MimeTypeTestWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: {
    content?: unknown;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  } | null;
}

interface TestCase {
  label: string;
  mimeType: string | null;
  expected: "valid" | "warning";
  description: string;
}

const CORRECT_MIMETYPE = "text/html;profile=mcp-app";

const testCases: TestCase[] = [
  {
    label: "Correct MIME Type",
    mimeType: CORRECT_MIMETYPE,
    expected: "valid",
    description: "SEP-1865 compliant",
  },
  {
    label: "Missing MIME Type",
    mimeType: null,
    expected: "warning",
    description: "No mimeType specified",
  },
  {
    label: "Wrong: text/html",
    mimeType: "text/html",
    expected: "warning",
    description: "Missing profile parameter",
  },
  {
    label: "Wrong: text/html+mcp",
    mimeType: "text/html+mcp",
    expected: "warning",
    description: "Legacy format (incorrect)",
  },
  {
    label: "Wrong: application/octet-stream",
    mimeType: "application/octet-stream",
    expected: "warning",
    description: "Binary MIME type",
  },
];

export function MimeTypeTestWidget({
  toolResult,
}: MimeTypeTestWidgetProps) {
  const currentMimeType = toolResult?.structuredContent?.mimeType as string | null;
  const testMode = toolResult?.structuredContent?.testMode as string | undefined;

  const currentTest = testCases.find(tc => {
    if (testMode === "missing") return tc.mimeType === null;
    return tc.mimeType === currentMimeType;
  }) || testCases[0];

  const isValid = currentMimeType === CORRECT_MIMETYPE;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <FileType className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">MIME Type Validation Test</h2>
        <p className="text-sm text-muted-foreground">
          SEP-1865 requires: <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">{CORRECT_MIMETYPE}</code>
        </p>
      </div>

      {/* Current Status */}
      <div className={`rounded-lg border-2 p-4 ${
        isValid
          ? "border-green-500/50 bg-green-50 dark:bg-green-950/30"
          : "border-amber-500/50 bg-amber-50 dark:bg-amber-950/30"
      }`}>
        <div className="flex items-start gap-3">
          {isValid ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 flex-1">
            <div className="font-medium">
              {isValid ? "Valid MIME Type" : "Invalid MIME Type"}
            </div>
            <div className="text-sm text-muted-foreground">
              Current: <code className="px-1.5 py-0.5 rounded bg-background/80 font-mono text-xs">
                {currentMimeType ?? "(missing)"}
              </code>
            </div>
            {!isValid && (
              <div className="text-sm text-amber-700 dark:text-amber-300">
                {currentTest.description}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Cases Reference */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Test Cases Reference</h3>
        <div className="space-y-2">
          {testCases.map((tc, idx) => {
            const isCurrent = tc.mimeType === currentMimeType ||
              (tc.mimeType === null && testMode === "missing");
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30"
                }`}
              >
                {tc.expected === "valid" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {tc.label}
                    {isCurrent && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                        current
                      </span>
                    )}
                  </div>
                  <code className="text-xs text-muted-foreground font-mono">
                    {tc.mimeType ?? "(no mimeType)"}
                  </code>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  tc.expected === "valid"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}>
                  {tc.expected === "valid" ? "✓ valid" : "⚠ warning"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground text-center border-t pt-4">
        Use the different <code className="px-1 rounded bg-muted">mime-type-*</code> tools to test each scenario
      </div>
    </div>
  );
}
