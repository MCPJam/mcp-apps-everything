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

// Resource URI uses nested _meta.ui.resourceUri per SEP-1865
// (The flat "ui/resourceUri" format is deprecated)

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
  // Script CDNs: esm.sh, jsdelivr, unpkg (for testing external script loading)
  resourceDomains: [
    "https://*.picsum.photos",
    "https://picsum.photos",
    "https://i.imgur.com",
    // External script CDNs (tests sandbox-proxy CSP fix)
    "https://esm.sh",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com",
  ],
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
  server.resource("main-widget", "ui://main", { mimeType: "text/html;profile=mcp-app" }, async () => ({
    contents: [{
      uri: "ui://main",
      mimeType: "text/html;profile=mcp-app",
      text: getWidgetHtml(),
      _meta: {
        ui: {
          csp: CSP_STRICT_CONFIG,
        }
      }
    }],
  }));

  // Widget with PERMISSIVE CSP (allows specific test domains)
  server.resource("permissive-widget", "ui://main-permissive", { mimeType: "text/html;profile=mcp-app" }, async () => ({
    contents: [{
      uri: "ui://main-permissive",
      mimeType: "text/html;profile=mcp-app",
      text: getWidgetHtml(),
      _meta: {
        ui: {
          csp: CSP_PERMISSIVE_CONFIG,
        }
      }
    }],
  }));

  // Counter widget (SEP-1865 compliant)
  server.resource("counter-widget", "ui://counter", { mimeType: "text/html;profile=mcp-app" }, async () => ({
    contents: [{ uri: "ui://counter", mimeType: "text/html;profile=mcp-app", text: getWidgetHtml() }],
  }));

  // =====================================
  // MIME TYPE TEST RESOURCES (SEP-1865)
  // =====================================

  // Correct MIME type: text/html;profile=mcp-app
  server.resource("mime-correct-widget", "ui://mime-correct", { mimeType: "text/html;profile=mcp-app" }, async () => ({
    contents: [{
      uri: "ui://mime-correct",
      mimeType: "text/html;profile=mcp-app",
      text: getWidgetHtml(),
    }],
  }));

  // Missing MIME type (omitted entirely)
  server.resource("mime-missing-widget", "ui://mime-missing", {}, async () => ({
    contents: [{
      uri: "ui://mime-missing",
      // No mimeType specified - should trigger warning
      text: getWidgetHtml(),
    }],
  }));

  // Wrong MIME type: text/html (missing profile parameter)
  server.resource("mime-wrong-html-widget", "ui://mime-wrong-html", { mimeType: "text/html" }, async () => ({
    contents: [{
      uri: "ui://mime-wrong-html",
      mimeType: "text/html",
      text: getWidgetHtml(),
    }],
  }));

  // Wrong MIME type: text/html+mcp (legacy format, not SEP-1865 compliant)
  server.resource("mime-wrong-legacy-widget", "ui://mime-wrong-legacy", { mimeType: "text/html+mcp" }, async () => ({
    contents: [{
      uri: "ui://mime-wrong-legacy",
      mimeType: "text/html+mcp",
      text: getWidgetHtml(),
    }],
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
      _meta: { ui: { resourceUri: "ui://main" } },
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
      _meta: { ui: { resourceUri: "ui://main" } },
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
      _meta: { ui: { resourceUri: "ui://main" } },
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
      _meta: { ui: { resourceUri: "ui://main" } },
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
      description: "Tests STRICT CSP - external scripts (esm.sh, jsdelivr, unpkg), fetch, and images should be BLOCKED",
      inputSchema: {},
      _meta: { ui: { resourceUri: "ui://main" } },
    },
    async (): Promise<CallToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: `CSP Test Suite (STRICT MODE). All external scripts, connections and resources should be BLOCKED.`,
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
      description: "Tests PERMISSIVE CSP - external scripts (esm.sh, jsdelivr, unpkg), fetch, and images should be ALLOWED",
      inputSchema: {},
      _meta: { ui: { resourceUri: "ui://main-permissive" } },
    },
    async (): Promise<CallToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: `CSP Test Suite (PERMISSIVE MODE). External scripts (esm.sh, jsdelivr, unpkg), API fetch, and images should be ALLOWED.`,
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
      _meta: { ui: { resourceUri: "ui://main" } },
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

  // Locale & Timezone Widget - Tests locale and timezone from host context
  server.registerTool(
    "locale-timezone",
    {
      title: "Locale & Timezone Demo",
      description: "Tests locale and timezone support from host context. Displays current locale/timezone and formats dates, times, and numbers accordingly.",
      inputSchema: {},
      _meta: { ui: { resourceUri: "ui://main" } },
    },
    async (): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `Locale and Timezone test widget. Displays host locale/timezone and formatted dates/numbers.`,
        },
      ],
      structuredContent: { _widget: "locale-timezone", timestamp: Date.now() },
    })
  );

  // Host Context Widget - Comprehensive display of ALL host context fields
  server.registerTool(
    "host-context",
    {
      title: "Host Context Demo",
      description: "Comprehensive display of ALL host context fields (theme, locale, timeZone, displayMode, viewport, platform, etc.). Reacts to changes in real-time.",
      inputSchema: {},
      _meta: { ui: { resourceUri: "ui://main" } },
    },
    async (): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `Host Context test widget. Displays all host context fields and reacts to changes.`,
        },
      ],
      structuredContent: { _widget: "host-context", timestamp: Date.now() },
    })
  );

  // =====================================
  // MIME TYPE TEST TOOLS (SEP-1865)
  // =====================================

  // MIME Type Test - Correct (text/html;profile=mcp-app)
  server.registerTool(
    "mime-type-correct",
    {
      title: "MIME Type Test (Correct)",
      description: "Tests SEP-1865 compliant MIME type: text/html;profile=mcp-app",
      inputSchema: {},
      _meta: { ui: { resourceUri: "ui://mime-correct" } },
    },
    async (): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `MIME Type test with CORRECT type: text/html;profile=mcp-app`,
        },
      ],
      structuredContent: {
        _widget: "mime-type-test",
        mimeType: "text/html;profile=mcp-app",
        testMode: "correct",
      },
    })
  );

  // MIME Type Test - Missing
  server.registerTool(
    "mime-type-missing",
    {
      title: "MIME Type Test (Missing)",
      description: "Tests resource with NO mimeType specified - should show warning",
      inputSchema: {},
      _meta: { ui: { resourceUri: "ui://mime-missing" } },
    },
    async (): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `MIME Type test with MISSING mimeType - should trigger warning`,
        },
      ],
      structuredContent: {
        _widget: "mime-type-test",
        mimeType: null,
        testMode: "missing",
      },
    })
  );

  // MIME Type Test - Wrong (text/html)
  server.registerTool(
    "mime-type-wrong-html",
    {
      title: "MIME Type Test (text/html)",
      description: "Tests resource with text/html (missing profile) - should show warning",
      inputSchema: {},
      _meta: { ui: { resourceUri: "ui://mime-wrong-html" } },
    },
    async (): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `MIME Type test with WRONG type: text/html (missing profile parameter)`,
        },
      ],
      structuredContent: {
        _widget: "mime-type-test",
        mimeType: "text/html",
        testMode: "wrong-html",
      },
    })
  );

  // MIME Type Test - Wrong (text/html+mcp - legacy format)
  server.registerTool(
    "mime-type-wrong-legacy",
    {
      title: "MIME Type Test (Legacy)",
      description: "Tests resource with text/html+mcp (legacy format) - should show warning",
      inputSchema: {},
      _meta: { ui: { resourceUri: "ui://mime-wrong-legacy" } },
    },
    async (): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `MIME Type test with WRONG type: text/html+mcp (legacy format, not SEP-1865 compliant)`,
        },
      ],
      structuredContent: {
        _widget: "mime-type-test",
        mimeType: "text/html+mcp",
        testMode: "wrong-legacy",
      },
    })
  );

  // =====================================
  // ROUTER TEST TOOL (BrowserRouter bug repro)
  // =====================================

  // Router Test Widget - Demonstrates BrowserRouter refresh bug
  server.registerTool(
    "router-test",
    {
      title: "Router Test (BrowserRouter Bug)",
      description: "Demonstrates the BrowserRouter refresh bug in iframes. Navigate to a page and refresh to see the bug.",
      inputSchema: {},
      _meta: { ui: { resourceUri: "ui://main" } },
    },
    async (): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `Router test widget. Navigate to Page 2 or Settings, then refresh the browser to reproduce the bug.`,
        },
      ],
      structuredContent: { _widget: "router-test", timestamp: Date.now() },
    })
  );

  // =====================================
  // SEP-1865 COMPLIANCE TEST TOOLS
  // =====================================

  // Partial Input Streaming Test - Tests ui/notifications/tool-input-partial
  server.registerTool(
    "partial-input-test",
    {
      title: "Partial Input Streaming Test",
      description: "Tests ui/notifications/tool-input-partial streaming from host to widget. Widget displays partial inputs as they stream.",
      inputSchema: {
        query: z.string().describe("A query string to process (longer queries show more streaming)"),
        options: z.object({
          limit: z.number().optional().describe("Optional result limit"),
          format: z.enum(["json", "text"]).optional().describe("Output format"),
        }).optional().describe("Optional processing options"),
      },
      _meta: { ui: { resourceUri: "ui://main" } },
    },
    async ({ query, options }): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `Processed query: "${query}" with options: ${JSON.stringify(options ?? {})}`,
        },
      ],
      structuredContent: {
        _widget: "partial-input-test",
        query,
        options,
        timestamp: Date.now(),
      },
    })
  );

  // Tool Cancellation Test - Tests ui/notifications/tool-cancelled
  server.registerTool(
    "cancellation-test",
    {
      title: "Tool Cancellation Test",
      description: "Tests ui/notifications/tool-cancelled handling. Simulates a long-running operation that can be cancelled.",
      inputSchema: {
        duration: z.number().default(10000).describe("Simulated operation duration in milliseconds"),
      },
      _meta: { ui: { resourceUri: "ui://main" } },
    },
    async ({ duration }): Promise<CallToolResult> => {
      // Simulate long-running operation
      await new Promise((resolve) => setTimeout(resolve, duration));
      return {
        content: [
          {
            type: "text",
            text: `Operation completed after ${duration}ms`,
          },
        ],
        structuredContent: {
          _widget: "cancellation-test",
          duration,
          completedAt: Date.now(),
        },
      };
    }
  );

  // CSS Variables Theming Test - Tests styles.variables from hostContext
  server.registerTool(
    "theming-test",
    {
      title: "CSS Variables Theming Test",
      description: "Tests styles.variables from hostContext (SEP-1865). Displays all CSS variables received from the host and shows a live preview.",
      inputSchema: {},
      _meta: { ui: { resourceUri: "ui://main" } },
    },
    async (): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: "CSS Variables Theming test widget. Displays host CSS variables and reacts to theme changes.",
        },
      ],
      structuredContent: {
        _widget: "theming-test",
        timestamp: Date.now(),
      },
    })
  );

  // Interactive Cancellation Test - Widget-initiated tool calls with AbortController cancellation
  server.registerTool(
    "interactive-cancellation",
    {
      title: "Interactive Cancellation Test",
      description: "Widget that initiates tool calls and can cancel them using AbortController. Click Start to call a long-running tool, then Cancel to abort it.",
      inputSchema: {
        duration: z.number().default(5000).describe("Duration for the cancellation-test tool call in milliseconds"),
      },
      _meta: { ui: { resourceUri: "ui://main" } },
    },
    async ({ duration }): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `Interactive cancellation widget ready. Will call cancellation-test with ${duration}ms duration when started.`,
        },
      ],
      structuredContent: {
        _widget: "interactive-cancellation",
        duration,
        timestamp: Date.now(),
      },
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
║    • tool-call        - tools/call demo                       ║
║    • open-link        - ui/open-link demo                     ║
║    • read-resource    - resources/read demo                   ║
║    • message          - ui/message demo                       ║
║    • csp-test         - CSP enforcement demo                  ║
║    • size-change      - ui/size-change demo                   ║
║    • locale-timezone  - locale/timezone demo                  ║
║    • host-context     - host context fields demo              ║
║    • router-test      - BrowserRouter bug repro               ║
╠═══════════════════════════════════════════════════════════════╣
║  MIME Type Test Tools:                                        ║
║    • mime-type-correct     - correct MIME type                ║
║    • mime-type-missing     - missing MIME type                ║
║    • mime-type-wrong-html  - wrong (text/html)                ║
║    • mime-type-wrong-legacy- wrong (text/html+mcp)            ║
╠═══════════════════════════════════════════════════════════════╣
║  Utility Tools:                                               ║
║    • increment     - Counter increment                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Resources:                                                   ║
║    • ui://main           - Widget HTML                        ║
║    • ui://mime-*         - MIME type test resources           ║
║    • tips://{id}         - Tips about MCP                     ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
