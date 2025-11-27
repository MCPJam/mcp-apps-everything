import { useEffect, useState, useCallback, useRef } from "react";
import type { JSONRPCMessage, HostContext, ToolInput, ToolResult, CallToolResult } from "../../shared/types";

interface AppState {
  isConnected: boolean;
  hostContext: HostContext | null;
  toolInput: ToolInput | null;
  toolResult: ToolResult | null;
}

interface UseAppReturn extends AppState {
  callServerTool: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
  sendMessage: (text: string) => Promise<void>;
}

let requestId = 1;
const pendingRequests = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function sendRequest<T>(method: string, params: unknown): Promise<T> {
  const id = requestId++;
  window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve: resolve as (v: unknown) => void, reject });
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
  });
  const initialized = useRef(false);

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
          break;
        case "ui/notifications/tool-result":
          setState((s) => ({ ...s, toolResult: data.params as ToolResult }));
          break;
        case "ui/notifications/host-context-change":
          setState((s) => ({
            ...s,
            hostContext: { ...s.hostContext, ...(data.params as HostContext) },
          }));
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // Initialize connection
    sendRequest<{ hostContext?: HostContext }>("ui/initialize", {
      protocolVersion: "2025-11-21",
      appInfo: { name: "mcp-apps-everything", version: "0.0.1" },
      appCapabilities: {},
    }).then((result) => {
      setState((s) => ({
        ...s,
        isConnected: true,
        hostContext: result.hostContext ?? null,
      }));
      sendNotification("ui/notifications/initialized");
    });

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const callServerTool = useCallback(
    async (name: string, args: Record<string, unknown>): Promise<CallToolResult> => {
      return sendRequest<CallToolResult>("tools/call", { name, arguments: args });
    },
    []
  );

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    await sendRequest("ui/message", {
      role: "user",
      content: { type: "text", text },
    });
  }, []);

  return { ...state, callServerTool, sendMessage };
}
