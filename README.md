# mcp-apps-everything

Minimal MVP implementation of SEP-1865 MCP Apps.

## Structure

```
├── server/          # MCP server with UI tools
│   └── index.ts     # Express + MCP SDK
├── widget/          # React widget (runs in iframe)
│   ├── App.tsx      # Counter widget
│   ├── main.tsx     # Entry point
│   └── hooks/
│       └── useApp.ts  # MCP Apps communication hook
├── shared/
│   └── types.ts     # SEP-1865 type definitions
└── dist/            # Built widget (single HTML file)
```

## Usage

```bash
npm install
npm run build   # Build widget to dist/
npm run dev     # Run server + vite dev
```

Server runs at `http://localhost:3001/mcp`

## SEP-1865 Implementation

- **UI Resources**: `ui://counter` with `text/html+mcp` mime type
- **Tool-UI Linkage**: `_meta["ui/resourceUri"]` on tools
- **Communication**: JSON-RPC over postMessage
  - `ui/initialize` → `ui/notifications/initialized`
  - `ui/notifications/tool-input` (host → widget)
  - `ui/notifications/tool-result` (host → widget)
  - `tools/call` (widget → host → server)
