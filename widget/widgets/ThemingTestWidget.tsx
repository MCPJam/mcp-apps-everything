/**
 * Theming Test Widget - Tests styles.variables from hostContext (SEP-1865)
 *
 * Tests the SDK's handling of styles.variables in hostContext.
 * This widget uses getHostContext().styles.variables to read CSS variables,
 * which the SDK should pass through from the host.
 */

import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps/react";

interface ThemingTestWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
  hostContext: McpUiHostContext | null;
}

// Known CSS variable names that the host should provide
const EXPECTED_CSS_VARIABLES = [
  "--color-background-primary",
  "--color-background-secondary",
  "--color-text-primary",
  "--color-text-secondary",
  "--color-border-primary",
  "--font-sans",
  "--font-mono",
  "--border-radius-sm",
  "--border-radius-md",
  "--border-radius-lg",
];

export function ThemingTestWidget({ app, hostContext }: ThemingTestWidgetProps) {
  // Get CSS variables from the hostContext prop passed from App.tsx
  // This avoids setting onhostcontextchanged which would conflict with App.tsx's handler
  const variables = (hostContext?.styles?.variables ?? {}) as Record<string, string>;

  // Log for debugging
  useEffect(() => {
    console.log("[ThemingTestWidget] Host context updated:", hostContext);
    console.log("[ThemingTestWidget] styles.variables:", variables);
  }, [hostContext, variables]);

  const count = Object.keys(variables).length;
  const passed = count > 0;

  // Check which expected variables are present/missing
  const presentVars = EXPECTED_CSS_VARIABLES.filter((v) => v in variables);
  const missingVars = EXPECTED_CSS_VARIABLES.filter((v) => !(v in variables));

  return (
    <div className="p-6">
      {/* Status */}
      <div
        className={`flex items-center justify-center gap-3 p-4 rounded-lg mb-4 ${
          passed ? "bg-green-500/10" : "bg-red-500/10"
        }`}
      >
        {passed ? (
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        ) : (
          <XCircle className="h-6 w-6 text-red-600" />
        )}
        <span
          className={`text-lg font-medium ${passed ? "text-green-600" : "text-red-600"}`}
        >
          {passed
            ? `${count} CSS variables received via SDK`
            : "No CSS variables received (SDK may be filtering styles)"}
        </span>
      </div>

      {/* Debug info */}
      <div className="text-xs text-muted-foreground mb-4 space-y-1">
        <div>
          <strong>Present ({presentVars.length}):</strong>{" "}
          {presentVars.length > 0 ? presentVars.join(", ") : "none"}
        </div>
        <div>
          <strong>Missing ({missingVars.length}):</strong>{" "}
          {missingVars.length > 0 ? missingVars.join(", ") : "none"}
        </div>
      </div>

      {/* Live Preview - styled entirely by host variables */}
      {passed && (
        <div
          className="p-4 border-2 transition-all duration-300"
          style={{
            backgroundColor: variables["--color-background-primary"],
            color: variables["--color-text-primary"],
            borderColor: variables["--color-border-primary"],
            borderRadius: variables["--border-radius-lg"],
          }}
        >
          <div className="font-semibold mb-1">Live Preview</div>
          <div
            className="text-sm"
            style={{ color: variables["--color-text-secondary"] }}
          >
            Toggle the host theme to see this box update.
          </div>
        </div>
      )}
    </div>
  );
}
