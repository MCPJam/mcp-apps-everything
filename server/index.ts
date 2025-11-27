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

// Sample notes data for demo
const sampleNotes = [
  {
    id: "note-1",
    title: "Welcome to MCP Apps",
    content:
      "This is a demo of MCP Apps (SEP-1865). MCP Apps enable rich, interactive UIs within MCP tool responses.",
    createdAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: "note-2",
    title: "About SEP-1865",
    content:
      "SEP-1865 defines a protocol for embedding interactive HTML/JS widgets in MCP responses. It uses JSON-RPC 2.0 over postMessage for iframe communication.",
    createdAt: new Date("2024-01-16").toISOString(),
  },
  {
    id: "note-3",
    title: "Available APIs",
    content:
      "• tools/call - Call other MCP tools\n• resources/read - Read MCP resources\n• ui/message - Send messages to chat\n• ui/open-link - Open external URLs\n• ui/size-change - Resize the widget",
    createdAt: new Date("2024-01-17").toISOString(),
  },
  {
    id: "note-4",
    title: "Implementation Notes",
    content:
      "The widget communicates with the host via a double-iframe sandbox architecture. The outer sandbox proxy handles message validation and forwarding.",
    createdAt: new Date("2024-01-18").toISOString(),
  },
  {
    id: "note-5",
    title: "Testing Tips",
    content:
      "Use MCPJam Inspector to test your MCP Apps. It provides full support for SEP-1865 including tool invocation, resource reads, and UI interactions.",
    createdAt: new Date("2024-01-19").toISOString(),
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

  // Single widget resource that handles all demos
  server.resource("main-widget", "ui://main", { mimeType: "text/html+mcp" }, async () => ({
    contents: [{ uri: "ui://main", mimeType: "text/html+mcp", text: getWidgetHtml() }],
  }));

  // Legacy counter resource for backwards compatibility
  server.resource("counter-widget", "ui://counter", { mimeType: "text/html+mcp" }, async () => ({
    contents: [{ uri: "ui://counter", mimeType: "text/html+mcp", text: getWidgetHtml() }],
  }));

  // =====================================
  // DATA RESOURCES (notes:// scheme)
  // =====================================

  // All notes list
  server.resource("notes-all", "notes://all", { mimeType: "application/json" }, async () => ({
    contents: [
      {
        uri: "notes://all",
        mimeType: "application/json",
        text: JSON.stringify(sampleNotes),
      },
    ],
  }));

  // Individual note resources
  for (const note of sampleNotes) {
    server.resource(
      `note-${note.id}`,
      `notes://${note.id}`,
      { mimeType: "application/json" },
      async () => ({
        contents: [
          {
            uri: `notes://${note.id}`,
            mimeType: "application/json",
            text: JSON.stringify(note),
          },
        ],
      })
    );
  }

  // =====================================
  // TOOLS WITH UI (use registerTool for _meta)
  // =====================================

  // Counter Tool - Demonstrates tools/call
  server.registerTool(
    "show-counter",
    {
      title: "Counter Widget",
      description: "Shows an interactive counter widget that demonstrates the tools/call API",
      inputSchema: {
        count: z.number().default(0).describe("Initial count value"),
      },
      _meta: { [RESOURCE_URI_META_KEY]: "ui://main" },
    },
    async ({ count }): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `Counter widget initialized at ${count}. Click the buttons to increment/decrement using tools/call.`,
        },
      ],
      structuredContent: { _widget: "counter", count, timestamp: Date.now() },
    })
  );

  // Weather Tool - Demonstrates ui/open-link
  server.registerTool(
    "show-weather",
    {
      title: "Weather Widget",
      description:
        "Shows a weather widget that demonstrates the ui/open-link API for opening external URLs",
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
            text: `Weather for ${location}: ${weatherData.temperature}°C, ${weatherData.condition}. Click the links to open external weather services.`,
          },
        ],
        structuredContent: { _widget: "weather", ...weatherData },
      };
    }
  );

  // Notes Tool - Demonstrates resources/read
  server.registerTool(
    "show-notes",
    {
      title: "Notes Widget",
      description:
        "Shows a notes browser widget that demonstrates the resources/read API for reading MCP resources",
      inputSchema: {
        filter: z.string().optional().describe("Optional filter text for notes"),
      },
      _meta: { [RESOURCE_URI_META_KEY]: "ui://main" },
    },
    async ({ filter }): Promise<CallToolResult> => {
      const filteredNotes = filter
        ? sampleNotes.filter(
            (n) =>
              n.title.toLowerCase().includes(filter.toLowerCase()) ||
              n.content.toLowerCase().includes(filter.toLowerCase())
          )
        : sampleNotes;

      return {
        content: [
          {
            type: "text",
            text: `Found ${filteredNotes.length} notes. Use the widget to browse and read notes via resources/read.`,
          },
        ],
        structuredContent: { _widget: "notes", notes: filteredNotes, filter: filter ?? null },
      };
    }
  );

  // Chat Tool - Demonstrates ui/message
  server.registerTool(
    "show-chat",
    {
      title: "Chat Widget",
      description:
        "Shows a chat widget that demonstrates the ui/message API for sending messages to the chat",
      inputSchema: {
        prompt: z.string().optional().describe("Initial prompt or context"),
      },
      _meta: { [RESOURCE_URI_META_KEY]: "ui://main" },
    },
    async ({ prompt }): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: prompt
            ? `Chat widget ready with context: "${prompt}". Use the quick actions or type a custom message.`
            : "Chat widget ready. Click quick actions or type a message to send via ui/message.",
        },
      ],
      structuredContent: { _widget: "chat", prompt: prompt ?? null, timestamp: Date.now() },
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

  // Create note tool
  server.registerTool(
    "create-note",
    {
      title: "Create Note",
      description: "Create a new note",
      inputSchema: {
        title: z.string().describe("Note title"),
        content: z.string().describe("Note content"),
      },
    },
    async ({ title, content }): Promise<CallToolResult> => {
      const newNote = {
        id: `note-${Date.now()}`,
        title,
        content,
        createdAt: new Date().toISOString(),
      };
      // In a real implementation, this would persist the note
      sampleNotes.push(newNote);

      return {
        content: [{ type: "text", text: `Note "${title}" created successfully` }],
        structuredContent: newNote,
      };
    }
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
║    • show-counter  - tools/call demo                          ║
║    • show-weather  - ui/open-link demo                        ║
║    • show-notes    - resources/read demo                      ║
║    • show-chat     - ui/message demo                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Utility Tools:                                               ║
║    • increment     - Counter increment                        ║
║    • create-note   - Note creation                            ║
╠═══════════════════════════════════════════════════════════════╣
║  Resources:                                                   ║
║    • ui://main     - Widget HTML                              ║
║    • notes://all   - All notes                                ║
║    • notes://{id}  - Individual notes                         ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
