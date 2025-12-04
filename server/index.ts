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
const PORT = process.env.PORT || 4001;

// Resource URI meta key per SEP-1865
const RESOURCE_URI_META_KEY = "ui/resourceUri";

// CSP configurations for CSP test widget (SEP-1865)

// STRICT: Empty arrays = all external requests BLOCKED
const CSP_STRICT_CONFIG = {
  connectDomains: [] as string[],
  resourceDomains: [] as string[],
};

// PERMISSIVE: Allow specific test domains
const CSP_PERMISSIVE_CONFIG = {
  // httpbin.org is CORS-friendly for testing
  connectDomains: ["https://httpbin.org", "https://jsonplaceholder.typicode.com"],
  // picsum.photos redirects to fastly.picsum.photos, so we need wildcard
  resourceDomains: ["https://*.picsum.photos", "https://picsum.photos", "https://i.imgur.com"],
};

// Session management
const transports = new Map<string, StreamableHTTPServerTransport>();

// Tips data for demo
const tips = [
  {
    id: "what-is-mcp",
    title: "What is MCP?",
    content: "Model Context Protocol (MCP) is an open protocol that enables seamless integration between AI applications and external data sources. It provides a standardized way for AI models to access tools, resources, and prompts.",
    emoji: "🔌",
  },
  {
    id: "what-are-apps",
    title: "What are MCP Apps?",
    content: "MCP Apps (SEP-1865) extend MCP to deliver rich, interactive user interfaces. They enable servers to embed HTML widgets in tool responses, creating dynamic experiences beyond plain text.",
    emoji: "✨",
  },
  {
    id: "how-resources-work",
    title: "How do Resources work?",
    content: "Resources in MCP are identified by URIs. Widgets can read resources using the resources/read API, enabling dynamic data fetching from the server. This tip was loaded using that exact API!",
    emoji: "📚",
  },
];

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

  // =====================================
  // UI RESOURCES (ui:// scheme)
  // =====================================

  // Main widget with STRICT CSP (blocks all external requests)
  server.resource("main-widget", "ui://main", { mimeType: "text/html+mcp" }, async () => ({
    contents: [{
      uri: "ui://main",
      mimeType: "text/html+mcp",
      text: getWidgetHtml(),
      _meta: {
        ui: {
          csp: CSP_STRICT_CONFIG,
        }
      }
    }],
  }));

  // Widget with PERMISSIVE CSP (allows specific test domains)
  server.resource("permissive-widget", "ui://main-permissive", { mimeType: "text/html+mcp" }, async () => ({
    contents: [{
      uri: "ui://main-permissive",
      mimeType: "text/html+mcp",
      text: getWidgetHtml(),
      _meta: {
        ui: {
          csp: CSP_PERMISSIVE_CONFIG,
        }
      }
    }],
  }));

  // Legacy counter resource for backwards compatibility
  server.resource("counter-widget", "ui://counter", { mimeType: "text/html+mcp" }, async () => ({
    contents: [{ uri: "ui://counter", mimeType: "text/html+mcp", text: getWidgetHtml() }],
  }));

  // =====================================
  // DATA RESOURCES (tips:// scheme)
  // =====================================

  // Individual tip resources
  for (const tip of tips) {
    server.resource(
      `tip-${tip.id}`,
      `tips://${tip.id}`,
      { mimeType: "application/json" },
      async () => ({
        contents: [
          {
            uri: `tips://${tip.id}`,
            mimeType: "application/json",
            text: JSON.stringify(tip),
          },
        ],
      })
    );
  }

  // =====================================
  // TOOLS WITH UI (use registerTool for _meta)
  // =====================================

  // Tool Call Widget - Demonstrates tools/call
  server.registerTool(
    "tool-call",
    {
      title: "Tool Call Demo",
      description: "Interactive counter that demonstrates the tools/call API",
      inputSchema: {
        count: z.number().default(0).describe("Initial count value"),
      },
      _meta: { [RESOURCE_URI_META_KEY]: "ui://main" },
    },
    async ({ count }): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `Counter initialized at ${count}. Click buttons to call the increment tool.`,
        },
      ],
      structuredContent: { _widget: "tool-call", count, timestamp: Date.now() },
    })
  );

  // Open Link Widget - Demonstrates ui/open-link
  server.registerTool(
    "open-link",
    {
      title: "Open Link Demo",
      description: "Weather widget that demonstrates the ui/open-link API for opening external URLs",
      inputSchema: {
        location: z.string().default("San Francisco").describe("Location to show weather for"),
        temperature: z.number().optional().describe("Temperature in Celsius"),
        condition: z
          .enum(["sunny", "cloudy", "rainy", "snowy", "stormy", "windy"])
          .optional()
          .describe("Weather condition"),
        humidity: z.number().optional().describe("Humidity percentage"),
        wind: z.number().optional().describe("Wind speed in km/h"),
      },
      _meta: { [RESOURCE_URI_META_KEY]: "ui://main" },
    },
    async ({ location, temperature, condition, humidity, wind }): Promise<CallToolResult> => {
      const weatherData = {
        location,
        temperature: temperature ?? Math.floor(Math.random() * 30) + 5,
        condition: condition ?? ["sunny", "cloudy", "rainy"][Math.floor(Math.random() * 3)],
        humidity: humidity ?? Math.floor(Math.random() * 60) + 30,
        wind: wind ?? Math.floor(Math.random() * 30) + 5,
      };

      return {
        content: [
          {
            type: "text",
            text: `Weather for ${location}: ${weatherData.temperature}°C, ${weatherData.condition}. Click links to open external services.`,
          },
        ],
        structuredContent: { _widget: "open-link", ...weatherData },
      };
    }
  );

  // Read Resource Widget - Demonstrates resources/read
  server.registerTool(
    "read-resource",
    {
      title: "Read Resource Demo",
      description: "Demonstrates the resources/read API for reading MCP resources",
      inputSchema: {},
      _meta: { [RESOURCE_URI_META_KEY]: "ui://main" },
    },
    async (): Promise<CallToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: `Ready to read resources. Click a topic to fetch it via resources/read.`,
          },
        ],
        structuredContent: { 
          _widget: "read-resource", 
          availableTips: tips.map(t => ({ id: t.id, title: t.title, emoji: t.emoji }))
        },
      };
    }
  );

  // Message Widget - Demonstrates ui/message
  server.registerTool(
    "message",
    {
      title: "Message Demo",
      description: "Demonstrates the ui/message API for sending messages to the chat",
      inputSchema: {},
      _meta: { [RESOURCE_URI_META_KEY]: "ui://main" },
    },
    async (): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: "Ready to send messages. Type or click to send via ui/message.",
        },
      ],
      structuredContent: { _widget: "message" },
    })
  );

  // CSP Test Widget (STRICT) - All external requests blocked
  server.registerTool(
    "csp-test",
    {
      title: "CSP Test (Strict)",
      description: "Tests STRICT CSP - all external requests should be BLOCKED",
      inputSchema: {},
      _meta: { [RESOURCE_URI_META_KEY]: "ui://main" },
    },
    async (): Promise<CallToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: `CSP Test Suite (STRICT MODE). All external connections and resources should be BLOCKED.`,
          },
        ],
        structuredContent: {
          _widget: "csp-test",
          csp: CSP_STRICT_CONFIG,
          mode: "strict",
        },
      };
    }
  );

  // CSP Test Widget (PERMISSIVE) - Specific domains allowed
  server.registerTool(
    "csp-test-permissive",
    {
      title: "CSP Test (Permissive)",
      description: "Tests PERMISSIVE CSP - specific domains should be ALLOWED (jsonplaceholder.typicode.com, picsum.photos)",
      inputSchema: {},
      _meta: { [RESOURCE_URI_META_KEY]: "ui://main-permissive" },
    },
    async (): Promise<CallToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: `CSP Test Suite (PERMISSIVE MODE). Allowed: jsonplaceholder.typicode.com (fetch), picsum.photos (images).`,
          },
        ],
        structuredContent: {
          _widget: "csp-test",
          csp: CSP_PERMISSIVE_CONFIG,
          mode: "permissive",
        },
      };
    }
  );

  // Size Change Widget - Demonstrates ui/size-change
  server.registerTool(
    "size-change",
    {
      title: "Size Change Demo",
      description: "Interactive widget that demonstrates the ui/size-change API for dynamically changing widget height",
      inputSchema: {
        height: z.number().default(300).describe("Initial height in pixels"),
      },
      _meta: { [RESOURCE_URI_META_KEY]: "ui://main" },
    },
    async ({ height }): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `Size change widget initialized at ${height}px. Use controls to change the height dynamically.`,
        },
      ],
      structuredContent: { _widget: "size-change", height, timestamp: Date.now() },
    })
  );

  // =====================================
  // UTILITY TOOLS (called by widgets)
  // =====================================

  // Increment tool for counter widget
  server.registerTool(
    "increment",
    {
      title: "Increment Counter",
      description: "Increment the counter by a specified amount",
      inputSchema: {
        count: z.number().describe("Current count value"),
        amount: z.number().default(1).describe("Amount to increment by"),
      },
    },
    async ({ count, amount }): Promise<CallToolResult> => ({
      content: [{ type: "text", text: `Counter incremented from ${count} to ${count + amount}` }],
      structuredContent: { count: count + amount, previousCount: count, amount, timestamp: Date.now() },
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
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         MCP Apps Everything - SEP-1865 Demo Server            ║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoint: http://localhost:${PORT}/mcp                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Tools with UI:                                               ║
║    • tool-call      - tools/call demo                         ║
║    • open-link      - ui/open-link demo                       ║
║    • read-resource  - resources/read demo                     ║
║    • message        - ui/message demo                         ║
║    • csp-test       - CSP enforcement demo                    ║
║    • size-change    - ui/size-change demo                     ║
╠═══════════════════════════════════════════════════════════════╣
║  Utility Tools:                                               ║
║    • increment     - Counter increment                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Resources:                                                   ║
║    • ui://main     - Widget HTML                              ║
║    • tips://{id}   - Tips about MCP                           ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
