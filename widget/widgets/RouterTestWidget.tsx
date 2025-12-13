/**
 * Router Test Widget - Demonstrates BrowserRouter refresh issue
 *
 * This widget uses BrowserRouter to reproduce the issue Andrew found:
 * When embedded in an iframe and the page is refreshed, BrowserRouter
 * changes the URL via history.replaceState, causing the iframe to load
 * the host app instead of the widget content.
 *
 * STEPS TO REPRODUCE:
 * 1. Load this widget in MCPJam Inspector
 * 2. Navigate to a different "page" (e.g., click "Page 2")
 * 3. Notice the URL in the iframe changes (e.g., to /page-2)
 * 4. Refresh the browser
 * 5. BUG: The entire MCPJam app appears inside the iframe
 *
 * FIX: Use MemoryRouter or HashRouter instead of BrowserRouter
 */

import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Home, FileText, Settings, RefreshCw } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";

interface RouterTestWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: {
    content?: unknown;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  } | null;
}

function CurrentLocationDisplay() {
  const location = useLocation();
  return (
    <div className="p-3 bg-muted rounded-lg font-mono text-sm">
      <div className="text-muted-foreground mb-1">Current pathname:</div>
      <div className="font-bold">{location.pathname}</div>
    </div>
  );
}

function HomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Home Page
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          This is the home page of the router test widget.
        </p>
        <CurrentLocationDisplay />
      </CardContent>
    </Card>
  );
}

function Page2() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Page 2
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          You navigated to Page 2. The URL should now show <code>/page-2</code>.
        </p>
        <CurrentLocationDisplay />
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-yellow-800 dark:text-yellow-200">
                Now try refreshing the browser!
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                If the bug exists, you'll see the entire MCPJam app appear in this iframe
                instead of this widget, because the server doesn't know about /page-2.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Settings Page
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          You navigated to Settings. The URL should now show <code>/settings</code>.
        </p>
        <CurrentLocationDisplay />
      </CardContent>
    </Card>
  );
}

function RouterContent() {
  return (
    <div className="p-4 space-y-4">
      {/* Warning Banner */}
      <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium text-red-800 dark:text-red-200">
              BrowserRouter Refresh Bug Test
            </div>
            <div className="text-sm text-red-700 dark:text-red-300 mt-1">
              This widget intentionally uses BrowserRouter to demonstrate the refresh bug.
              Navigate to another page and refresh to see the issue.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 flex-wrap">
        <Link to="/">
          <Button variant="outline" size="sm">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Button>
        </Link>
        <Link to="/page-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-1" />
            Page 2
          </Button>
        </Link>
        <Link to="/settings">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh Page
        </Button>
      </div>

      {/* Router Type Badge */}
      <div className="flex gap-2">
        <Badge variant="destructive">Using: BrowserRouter</Badge>
        <Badge variant="secondary">Bug: URL changes break refresh</Badge>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/page-2" element={<Page2 />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>

      {/* Instructions */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <h3 className="font-medium mb-2">How to reproduce the bug:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Click on "Page 2" or "Settings" above</li>
            <li>Notice the URL in the browser changes (e.g., to /page-2)</li>
            <li>Click the "Refresh Page" button or press Cmd+R / F5</li>
            <li>Observe: The MCPJam Inspector app appears inside this iframe!</li>
          </ol>
          <div className="mt-3 text-sm">
            <strong>Why?</strong> BrowserRouter uses history.replaceState() to change the URL.
            On refresh, the browser requests /page-2 from the server, which returns
            the main app HTML (SPA fallback behavior).
          </div>
          <div className="mt-3 text-sm">
            <strong>Fix:</strong> Use <code>MemoryRouter</code> (keeps routing in memory)
            or <code>HashRouter</code> (uses #/page-2 style URLs).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RouterTestWidget({ app }: RouterTestWidgetProps) {
  return (
    <BrowserRouter>
      <RouterContent />
    </BrowserRouter>
  );
}
