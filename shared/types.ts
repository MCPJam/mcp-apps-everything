/**
 * SEP-1865 MCP Apps Types
 * Complete type definitions for the MCP Apps protocol
 */

// JSON-RPC 2.0 base types
export interface JSONRPCMessage {
  jsonrpc: "2.0";
  id?: string | number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// Host context provided by the client
export interface HostContext {
  theme?: "light" | "dark" | "system";
  displayMode?: "inline" | "fullscreen" | "pip" | "carousel";
  viewport?: { width: number; height: number; maxHeight?: number };
  locale?: string;
  platform?: string;
  userAgent?: string;
}

// Tool input notification params
export interface ToolInput {
  arguments: Record<string, unknown>;
}

// Tool result notification params
export interface ToolResult {
  content?: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

// Result from calling a tool via tools/call
export interface CallToolResult {
  content: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

// Resource content from resources/read
export interface ResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export interface ReadResourceResult {
  contents: ResourceContent[];
}

// ui/initialize request params
export interface InitializeParams {
  protocolVersion: string;
  appInfo: { name: string; version: string };
  appCapabilities: Record<string, unknown>;
}

// ui/initialize response
export interface InitializeResult {
  protocolVersion: string;
  hostCapabilities: Record<string, unknown>;
  hostInfo: { name: string; version: string };
  hostContext: HostContext;
}

// ui/message request params
export interface MessageParams {
  role: "user" | "assistant";
  content: { type: "text"; text: string };
}

// ui/open-link request params
export interface OpenLinkParams {
  url: string;
}

// ui/size-change notification params
export interface SizeChangeParams {
  width?: number;
  height?: number;
}

// Tool cancelled notification params
export interface ToolCancelledParams {
  reason?: string;
}

// Resource teardown request params (SEP-1865 says this is a request, not notification)
export interface TeardownParams {
  reason?: string;
}
