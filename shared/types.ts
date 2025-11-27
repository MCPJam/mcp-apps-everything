// SEP-1865 MCP Apps Types (minimal subset)

export interface JSONRPCMessage {
  jsonrpc: "2.0";
  id?: string | number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string };
}

export interface HostContext {
  theme?: "light" | "dark" | "system";
  displayMode?: "inline" | "fullscreen" | "pip" | "carousel";
  viewport?: { width: number; height: number };
  locale?: string;
}

export interface ToolInput {
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface CallToolResult {
  content: Array<{ type: string; text?: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}
