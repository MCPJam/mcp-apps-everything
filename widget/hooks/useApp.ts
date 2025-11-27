/**
 * useApp - React hook for MCP Apps using the official SDK
 *
 * Wraps @modelcontextprotocol/ext-apps SDK to provide:
 * - tools/call: Call MCP tools
 * - resources/read: Read MCP resources
 * - ui/message: Send messages to chat
 * - ui/open-link: Open external links
 * - Auto resize notifications
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useApp as useSdkApp, App } from "@modelcontextprotocol/ext-apps/react";
import type {
  McpUiToolInputNotification,
  McpUiToolResultNotification,
  McpUiHostContextChangedNotification,
} from "@modelcontextprotocol/ext-apps";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

export type { CallToolResult, ReadResourceResult };

export interface ToolInput {
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  content?: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface HostContext {
  theme?: "light" | "dark" | "system";
  displayMode?: "inline" | "fullscreen" | "pip" | "carousel";
  viewport?: { width: number; height: number; maxHeight?: number };
  locale?: string;
  platform?: string;
  userAgent?: string;
}

interface UseAppReturn {
  isConnected: boolean;
  error: Error | null;
  hostContext: HostContext | null;
  toolInput: ToolInput | null;
  toolResult: ToolResult | null;
  callTool: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
  readResource: (uri: string) => Promise<ReadResourceResult>;
  sendMessage: (text: string) => Promise<void>;
  openLink: (url: string) => Promise<void>;
}

export function useApp(): UseAppReturn {
  const [toolInput, setToolInput] = useState<ToolInput | null>(null);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [hostContext, setHostContext] = useState<HostContext | null>(null);

  const { app, isConnected, error } = useSdkApp({
    appInfo: { name: "mcp-apps-everything", version: "0.0.1" },
    capabilities: {},
    onAppCreated: (app: App) => {
      // Register event handlers before connection
      app.ontoolinput = (params: McpUiToolInputNotification["params"]) => {
        setToolInput({ arguments: params.arguments ?? {} });
      };

      app.ontoolresult = (params: McpUiToolResultNotification["params"]) => {
        setToolResult({
          content: params.content,
          structuredContent: params.structuredContent,
          isError: params.isError,
        });
      };

      app.onhostcontextchanged = (params: McpUiHostContextChangedNotification["params"]) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
    },
  });

  // Log connection errors for debugging
  useEffect(() => {
    if (error) {
      console.error("[MCP Apps] Connection error:", error);
    }
  }, [error]);

  // Convenience wrapper for callServerTool
  const callTool = useCallback(
    async (name: string, args: Record<string, unknown>): Promise<CallToolResult> => {
      if (!app) throw new Error("App not connected");
      return app.callServerTool({ name, arguments: args });
    },
    [app]
  );

  // Convenience wrapper for readServerResource
  const readResource = useCallback(
    async (uri: string): Promise<ReadResourceResult> => {
      if (!app) throw new Error("App not connected");
      return app.readServerResource({ uri });
    },
    [app]
  );

  // Convenience wrapper for sendMessage
  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      if (!app) throw new Error("App not connected");
      await app.sendMessage({
        role: "user",
        content: [{ type: "text", text }],
      });
    },
    [app]
  );

  // Convenience wrapper for openLink
  const openLink = useCallback(
    async (url: string): Promise<void> => {
      if (!app) throw new Error("App not connected");
      await app.sendOpenLink({ url });
    },
    [app]
  );

  return {
    isConnected,
    error,
    hostContext,
    toolInput,
    toolResult,
    callTool,
    readResource,
    sendMessage,
    openLink,
  };
}
