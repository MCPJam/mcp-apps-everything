# MCP Apps Everything

Complete implementation of SEP-1865 MCP Apps - showcasing all APIs and features.

## Features

This demo server includes **4 interactive widgets** demonstrating all SEP-1865 APIs:

| Widget | Tool | API Demonstrated |
|--------|------|------------------|
| Counter | `show-counter` | `tools/call` - Call MCP tools from the widget |
| Weather | `show-weather` | `ui/open-link` - Open external URLs |
| Notes | `show-notes` | `resources/read` - Read MCP resources |
| Chat | `show-chat` | `ui/message` - Send messages to chat |

## Quick Start

```bash
npm install
npm run build   # Build widget to dist/
npm start       # Start MCP server
```

Server runs at `http://localhost:4001/mcp`

## Development

```bash
npm run dev     # Run server + vite dev (hot reload)
```

## Project Structure

```
├── server/
│   └── index.ts         # MCP server with all tools & resources
├── widget/
│   ├── App.tsx          # Main app with tabbed interface
│   ├── main.tsx         # Entry point
│   ├── globals.css      # Global styles
│   ├── components/
│   │   └── ui/          # Reusable UI components
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── textarea.tsx
│   ├── hooks/
│   │   └── useApp.ts    # React hook for all SEP-1865 APIs
│   ├── lib/
│   │   └── utils.ts     # Utility functions
│   └── widgets/
│       ├── ToolCallWidget.tsx    # tools/call demo
│       ├── OpenLinkWidget.tsx    # ui/open-link demo
│       ├── ReadResourceWidget.tsx  # resources/read demo
│       └── MessageWidget.tsx     # ui/message demo
├── shared/
│   └── types.ts         # Complete SEP-1865 type definitions
├── dist/                # Built widget (single HTML file)
├── index.html           # Root HTML file
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## SEP-1865 APIs

### Widget → Host Requests

| Method | Description |
|--------|-------------|
| `ui/initialize` | Initialize the widget and get host context |
| `tools/call` | Call an MCP tool on the server |
| `resources/read` | Read an MCP resource |
| `ui/message` | Send a message to the chat |
| `ui/open-link` | Open an external URL in the browser |

### Widget → Host Notifications

| Method | Description |
|--------|-------------|
| `ui/notifications/initialized` | Widget is fully initialized |
| `ui/size-change` | Widget requests a size change |

### Host → Widget Notifications

| Method | Description |
|--------|-------------|
| `ui/notifications/tool-input` | Tool arguments before execution |
| `ui/notifications/tool-result` | Tool result after execution |
| `ui/host-context-change` | Theme or display mode changed |
| `ui/tool-cancelled` | User cancelled the tool |
| `ui/resource-teardown` | Widget is being removed |

## MCP Server Tools

### Tools with UI

- **`show-counter`** - Interactive counter demonstrating `tools/call`
- **`show-weather`** - Weather display demonstrating `ui/open-link`
- **`show-notes`** - Notes browser demonstrating `resources/read`
- **`show-chat`** - Chat interface demonstrating `ui/message`

### Utility Tools

- **`increment`** - Increment counter (called by Counter widget)
- **`create-note`** - Create a new note

## MCP Server Resources

### UI Resources (`ui://`)

- `ui://main` - Main widget HTML (text/html+mcp)
- `ui://counter` - Legacy counter resource (backwards compatible)

## Using with MCPJam Inspector

1. Start the server: `npm start`
2. Open MCPJam Inspector
3. Connect to `http://localhost:4001/mcp` (Streamable HTTP)
4. Go to Tools tab and run any tool
5. The interactive widget will render in place of raw JSON

## Widget Development

The `useApp()` hook provides all SEP-1865 APIs:

```typescript
import { useApp } from "./hooks/useApp";

function MyWidget() {
  const {
    // State
    isConnected,
    hostContext,      // { theme, displayMode, ... }
    toolInput,        // Arguments passed to tool
    toolResult,       // Result from tool execution
    isCancelled,
    isTearingDown,

    // Request APIs
    callTool,         // (name, args) => Promise<CallToolResult>
    readResource,     // (uri) => Promise<ReadResourceResult>
    sendMessage,      // (text) => Promise<void>
    openLink,         // (url) => Promise<void>

    // Notification APIs
    resize,           // (width, height) => void
  } = useApp();

  // Use hostContext.theme for theming
  const isDark = hostContext?.theme === "dark";

  // ...
}
```

## Technical Details

### Tool-UI Linkage

Tools declare their UI resource via `_meta`:

```typescript
server.registerTool("show-counter", {
  _meta: { "ui/resourceUri": "ui://main" },
  // ...
});
```

### Security

The widget runs in a sandboxed iframe. The host controls:
- Which tools can be called
- Which resources can be read
- Which URLs can be opened

## License

MIT
