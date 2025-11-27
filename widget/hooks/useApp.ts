/**
 * useApp - React hook for MCP Apps (SEP-1865)
 *
 * Provides all SEP-1865 APIs:
 * - tools/call: Call MCP tools
 * - resources/read: Read MCP resources
 * - ui/message: Send messages to chat
 * - ui/open-link: Open external links
 * - ui/size-change: Notify host of size changes
 *
 * Events:
 * - mcp:tool-input: Tool input received
 * - mcp:tool-result: Tool result received
 * - mcp:context-change: Host context changed
 * - mcp:tool-cancelled: Tool was cancelled
 * - mcp:teardown: Widget is being torn down
 */

import { useEffect, useState, useCallback, useRef } from "react";
import type {
  JSONRPCMessage,
  HostContext,
  ToolInput,
  ToolResult,
  CallToolResult,
  ReadResourceResult,
  InitializeResult,
} from "../../shared/types";

interface AppState {
  isConnected: boolean;
  hostContext: HostContext | null;
  toolInput: ToolInput | null;
  toolResult: ToolResult | null;
  isCancelled: boolean;
  isTearingDown: boolean;
}

interface UseAppReturn extends AppState {
  // SEP-1865 Request APIs
  callTool: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
  readResource: (uri: string) => Promise<ReadResourceResult>;
  sendMessage: (text: string) => Promise<void>;
  openLink: (url: string) => Promise<void>;

  // SEP-1865 Notification APIs
  resize: (width: number, height: number) => void;

  // Event handlers (set these to handle events)
  onToolCancelled: React.MutableRefObject<((reason?: string) => void) | null>;
  onTeardown: React.MutableRefObject<((reason?: string) => void) | null>;
}

let requestId = 1;
const pendingRequests = new Map<
  number,
  { resolve: (v: unknown) => void; reject: (e: Error) => void; timeout: ReturnType<typeof setTimeout> }
>();

const REQUEST_TIMEOUT = 30000; // 30 seconds

function sendRequest<T>(method: string, params: unknown): Promise<T> {
  const id = requestId++;
  window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Request timeout: ${method}`));
    }, REQUEST_TIMEOUT);

    pendingRequests.set(id, {
      resolve: resolve as (v: unknown) => void,
      reject,
      timeout,
    });
  });
}

function sendNotification(method: string, params?: unknown) {
  window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
}

export function useApp(): UseAppReturn {
  const [state, setState] = useState<AppState>({
    isConnected: false,
    hostContext: null,
    toolInput: null,
    toolResult: null,
    isCancelled: false,
    isTearingDown: false,
  });

  const initialized = useRef(false);
  const onToolCancelled = useRef<((reason?: string) => void) | null>(null);
  const onTeardown = useRef<((reason?: string) => void) | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as JSONRPCMessage;
      if (!data || data.jsonrpc !== "2.0") return;

      // Handle responses to our requests
      if (data.id !== undefined && (data.result !== undefined || data.error)) {
        const pending = pendingRequests.get(data.id as number);
        if (pending) {
          clearTimeout(pending.timeout);
          pendingRequests.delete(data.id as number);
          if (data.error) {
            pending.reject(new Error(data.error.message));
          } else {
            pending.resolve(data.result);
          }
        }
        return;
      }

      // Handle notifications from host
      switch (data.method) {
        case "ui/notifications/tool-input":
          setState((s) => ({ ...s, toolInput: data.params as ToolInput }));
          window.dispatchEvent(new CustomEvent("mcp:tool-input", { detail: data.params }));
          break;

        case "ui/notifications/tool-result":
          setState((s) => ({ ...s, toolResult: data.params as ToolResult }));
          window.dispatchEvent(new CustomEvent("mcp:tool-result", { detail: data.params }));
          break;

        case "ui/host-context-change":
          setState((s) => ({
            ...s,
            hostContext: { ...s.hostContext, ...(data.params as HostContext) },
          }));
          window.dispatchEvent(new CustomEvent("mcp:context-change", { detail: data.params }));
          break;

        case "ui/tool-cancelled":
          setState((s) => ({ ...s, isCancelled: true }));
          window.dispatchEvent(new CustomEvent("mcp:tool-cancelled", { detail: data.params }));
          onToolCancelled.current?.((data.params as { reason?: string })?.reason);
          break;

        case "ui/resource-teardown":
          setState((s) => ({ ...s, isTearingDown: true }));
          window.dispatchEvent(new CustomEvent("mcp:teardown", { detail: data.params }));
          onTeardown.current?.((data.params as { reason?: string })?.reason);
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // Initialize connection with host
    sendRequest<InitializeResult>("ui/initialize", {
      protocolVersion: "2025-06-18",
      appInfo: { name: "mcp-apps-everything", version: "0.0.1" },
      appCapabilities: {
        // Declare supported features
        resize: true,
        toolCalls: true,
        resourceReads: true,
      },
    }).then((result) => {
      setState((s) => ({
        ...s,
        isConnected: true,
        hostContext: result.hostContext ?? null,
      }));
      // Notify host that we're fully initialized
      sendNotification("ui/notifications/initialized");
    }).catch((err) => {
      console.error("[MCP Apps] Initialization failed:", err);
    });

    return () => {
      window.removeEventListener("message", handleMessage);
      // Clear any pending requests
      for (const [, pending] of pendingRequests) {
        clearTimeout(pending.timeout);
      }
      pendingRequests.clear();
    };
  }, []);

  // SEP-1865: tools/call - Call another MCP tool
  const callTool = useCallback(
    async (name: string, args: Record<string, unknown>): Promise<CallToolResult> => {
      return sendRequest<CallToolResult>("tools/call", { name, arguments: args });
    },
    []
  );

  // SEP-1865: resources/read - Read an MCP resource
  const readResource = useCallback(
    async (uri: string): Promise<ReadResourceResult> => {
      return sendRequest<ReadResourceResult>("resources/read", { uri });
    },
    []
  );

  // SEP-1865: ui/message - Send a message to the chat
  const sendMessage = useCallback(async (text: string): Promise<void> => {
    await sendRequest("ui/message", {
      role: "user",
      content: { type: "text", text },
    });
  }, []);

  // SEP-1865: ui/open-link - Open an external link
  const openLink = useCallback(async (url: string): Promise<void> => {
    await sendRequest("ui/open-link", { url });
  }, []);

  // SEP-1865: ui/size-change - Notify host of size change (notification, no response)
  const resize = useCallback((width: number, height: number) => {
    sendNotification("ui/size-change", { width, height });
  }, []);

  return {
    ...state,
    callTool,
    readResource,
    sendMessage,
    openLink,
    resize,
    onToolCancelled,
    onTeardown,
  };
}
