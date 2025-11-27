import express from "express";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Resource URI meta key per SEP-1865
const RESOURCE_URI_META_KEY = "ui/resourceUri";

// Session management
const transports = new Map<string, StreamableHTTPServerTransport>();

function createServer() {
  const server = new McpServer({ name: "mcp-apps-everything", version: "0.0.1" });

  // Load widget HTML (built by vite)
  const getWidgetHtml = () => {
    try {
      return readFileSync(join(__dirname, "../dist/index.html"), "utf-8");
    } catch {
      return "<html><body>Widget not built. Run: npm run build</body></html>";
    }
  };

  // Register UI resource with ui:// scheme
  server.resource("counter-widget", "ui://counter", { mimeType: "text/html+mcp" }, async () => ({
    contents: [{ uri: "ui://counter", mimeType: "text/html+mcp", text: getWidgetHtml() }],
  }));

  // Register tool linked to UI resource - use registerTool to include _meta
  server.registerTool(
    "show-counter",
    {
      title: "Counter Widget",
      description: "Shows an interactive counter widget",
      inputSchema: {
        count: z.number().default(0).describe("Initial count value"),
      },
      _meta: { [RESOURCE_URI_META_KEY]: "ui://counter" },
    },
    async ({ count }): Promise<CallToolResult> => ({
      content: [{ type: "text", text: `Counter initialized at ${count}` }],
      structuredContent: { count, timestamp: Date.now() },
    })
  );

  // A tool the widget can call
  server.registerTool(
    "increment",
    {
      title: "Increment",
      description: "Increment the counter",
      inputSchema: {
        count: z.number(),
        amount: z.number().default(1),
      },
    },
    async ({ count, amount }): Promise<CallToolResult> => ({
      content: [{ type: "text", text: `Incremented to ${count + amount}` }],
      structuredContent: { count: count + amount, timestamp: Date.now() },
    })
  );

  return server;
}

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// MCP endpoint
app.all("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // New session
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      transports.set(id, transport);
      console.log(`Session created: ${id}`);
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      transports.delete(transport.sessionId);
      console.log(`Session closed: ${transport.sessionId}`);
    }
  };

  const server = createServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`MCP server running at http://localhost:${PORT}/mcp`);
});
