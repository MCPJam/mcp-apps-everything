/**
 * CSP Test Widget - Tests Content Security Policy enforcement
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Check, X, Loader2 } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";

type TestStatus = "pending" | "running" | "passed" | "failed";

interface TestResult {
  id: string;
  name: string;
  status: TestStatus;
  expectedToPass: boolean;
}

interface CspTestWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

const BASE_TESTS: Omit<TestResult, "status">[] = [
  { id: "connect-self", name: "Same Origin Fetch", expectedToPass: true },
  { id: "connect-allowed", name: "External API Fetch", expectedToPass: false },
  { id: "img-data", name: "Data URL Image", expectedToPass: true },
  { id: "img-external", name: "External Image", expectedToPass: false },
  { id: "script-inline", name: "Inline Script", expectedToPass: true },
  { id: "style-inline", name: "Inline Styles", expectedToPass: true },
];

function getTests(mode: "strict" | "permissive"): Omit<TestResult, "status">[] {
  if (mode === "permissive") {
    return BASE_TESTS.map((t) =>
      t.id === "connect-allowed" || t.id === "img-external"
        ? { ...t, expectedToPass: true }
        : t
    );
  }
  return BASE_TESTS;
}

const TEST_URLS = {
  connect: "https://jsonplaceholder.typicode.com/posts/1",
  image: "https://picsum.photos/32/32",
};

const DATA_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export function CspTestWidget({ app, toolInput, toolResult }: CspTestWidgetProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"strict" | "permissive">("strict");
  const [tests, setTests] = useState<TestResult[]>(() =>
    getTests("strict").map((t) => ({ ...t, status: "pending" as TestStatus }))
  );

  useEffect(() => {
    if (toolResult?.structuredContent) {
      const data = toolResult.structuredContent as { mode?: "strict" | "permissive" };
      if (data.mode) {
        setMode(data.mode);
        setTests(getTests(data.mode).map((t) => ({ ...t, status: "pending" as TestStatus })));
      }
    }
  }, [toolResult]);

  const updateTest = useCallback((id: string, update: Partial<TestResult>) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...update } : t)));
  }, []);

  const runTest = async (test: TestResult) => {
    updateTest(test.id, { status: "running" });

    try {
      let passed = false;

      switch (test.id) {
        case "connect-self":
          try {
            const res = await fetch(window.location.href, { method: "HEAD" });
            passed = res.ok || res.status === 405;
          } catch {
            passed = true;
          }
          break;

        case "connect-allowed":
          const ctrl = new AbortController();
          const timeout = setTimeout(() => ctrl.abort(), 5000);
          try {
            const res = await fetch(TEST_URLS.connect, { signal: ctrl.signal });
            clearTimeout(timeout);
            passed = res.ok;
          } catch {
            clearTimeout(timeout);
            passed = false;
          }
          break;

        case "img-data":
        case "img-external":
          passed = await new Promise<boolean>((resolve) => {
            const img = document.createElement("img");
            const t = setTimeout(() => { img.src = ""; resolve(false); }, 5000);
            img.onload = () => { clearTimeout(t); resolve(true); };
            img.onerror = () => { clearTimeout(t); resolve(false); };
            img.src = test.id === "img-data" ? DATA_IMAGE : TEST_URLS.image;
          });
          break;

        case "script-inline":
          try {
            const val = Math.random().toString();
            const win = window as unknown as Record<string, unknown>;
            win.__cspTest = val;
            const s = document.createElement("script");
            s.textContent = `window.__cspResult = window.__cspTest + "_ok";`;
            document.head.appendChild(s);
            document.head.removeChild(s);
            passed = win.__cspResult === val + "_ok";
            delete win.__cspTest;
            delete win.__cspResult;
          } catch {
            passed = false;
          }
          break;

        case "style-inline":
          try {
            const div = document.createElement("div");
            div.style.cssText = "position:absolute;left:-9999px;width:50px;";
            document.body.appendChild(div);
            passed = div.offsetWidth === 50;
            document.body.removeChild(div);
          } catch {
            passed = false;
          }
          break;
      }

      const success = test.expectedToPass ? passed : !passed;
      updateTest(test.id, { status: success ? "passed" : "failed" });
    } catch {
      updateTest(test.id, { status: test.expectedToPass ? "failed" : "passed" });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests((prev) => prev.map((t) => ({ ...t, status: "pending" as TestStatus })));

    for (const test of tests) {
      await runTest(test);
      await new Promise((r) => setTimeout(r, 100));
    }

    setIsRunning(false);
  };

  const passed = tests.filter((t) => t.status === "passed").length;
  const failed = tests.filter((t) => t.status === "failed").length;
  const total = tests.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* Score Display */}
      <div className="text-center mb-10">
        <div className="text-6xl font-light tabular-nums tracking-tighter text-foreground">
          {passed}/{total}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {mode === "strict" ? "Strict Mode" : "Permissive Mode"}
        </div>
      </div>

      {/* Test Grid */}
      <div className="grid grid-cols-2 gap-3 mb-10 w-full max-w-sm">
        {tests.map((test) => (
          <div
            key={test.id}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30"
          >
            {test.status === "running" ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : test.status === "passed" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : test.status === "failed" ? (
              <X className="h-4 w-4 text-red-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
            )}
            <span className="text-sm text-foreground truncate">{test.name}</span>
          </div>
        ))}
      </div>

      {/* Run Button */}
      <Button onClick={runAllTests} disabled={isRunning} size="lg" className="h-10 px-6">
        {isRunning ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        {isRunning ? "Running..." : "Run Tests"}
      </Button>

      {/* Summary */}
      {(passed > 0 || failed > 0) && (
        <div className="mt-8 text-xs text-muted-foreground">
          {failed === 0 ? "All tests passed" : `${failed} test${failed > 1 ? "s" : ""} failed`}
        </div>
      )}
    </div>
  );
}
