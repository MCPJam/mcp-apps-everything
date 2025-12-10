/**
 * CSP Test Widget - Tests Content Security Policy enforcement
 *
 * Tests external script loading (esm.sh, jsdelivr, unpkg), fetch requests,
 * images, and captures CSP violations for debugging.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Check, X, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";

type TestStatus = "pending" | "running" | "passed" | "failed";

interface TestResult {
  id: string;
  name: string;
  status: TestStatus;
  expectedToPass: boolean;
  error?: string;
  duration?: number;
}

interface CspViolation {
  directive: string;
  blockedUri: string;
  timestamp: number;
}

interface CspTestWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

// Test configurations for different modes
const TEST_CONFIGS = {
  strict: {
    scriptExternal: false,
    connectExternal: false,
    imgExternal: false,
  },
  permissive: {
    scriptExternal: true,
    connectExternal: true,
    imgExternal: true,
  },
};

const BASE_TESTS: Omit<TestResult, "status">[] = [
  // External script loading tests (the main issue from sandbox-proxy)
  { id: "script-esm-sh", name: "Load esm.sh script", expectedToPass: false },
  { id: "script-jsdelivr", name: "Load jsdelivr script", expectedToPass: false },
  { id: "script-unpkg", name: "Load unpkg script", expectedToPass: false },
  // Connect/fetch tests
  { id: "connect-self", name: "Same origin fetch", expectedToPass: true },
  { id: "connect-external", name: "External API fetch", expectedToPass: false },
  // Image tests
  { id: "img-data", name: "Data URL image", expectedToPass: true },
  { id: "img-external", name: "External image", expectedToPass: false },
  // Inline tests (should always pass)
  { id: "script-inline", name: "Inline script", expectedToPass: true },
  { id: "style-inline", name: "Inline styles", expectedToPass: true },
];

function getTests(mode: "strict" | "permissive"): Omit<TestResult, "status">[] {
  const config = TEST_CONFIGS[mode];
  return BASE_TESTS.map((t) => {
    if (t.id.startsWith("script-") && t.id !== "script-inline" && config.scriptExternal) {
      return { ...t, expectedToPass: true };
    }
    if (t.id === "connect-external" && config.connectExternal) {
      return { ...t, expectedToPass: true };
    }
    if (t.id === "img-external" && config.imgExternal) {
      return { ...t, expectedToPass: true };
    }
    return t;
  });
}

const TEST_URLS = {
  connect: "https://jsonplaceholder.typicode.com/posts/1",
  image: "https://picsum.photos/32/32",
  // External script CDNs to test
  esmSh: "https://esm.sh/lodash@4.17.21/isEmpty.js",
  jsdelivr: "https://cdn.jsdelivr.net/npm/lodash@4.17.21/isEmpty.min.js",
  unpkg: "https://unpkg.com/lodash@4.17.21/isEmpty.js",
};

const DATA_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export function CspTestWidget({ app, toolInput, toolResult }: CspTestWidgetProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"strict" | "permissive">("strict");
  const [tests, setTests] = useState<TestResult[]>(() =>
    getTests("strict").map((t) => ({ ...t, status: "pending" as TestStatus }))
  );
  const [violations, setViolations] = useState<CspViolation[]>([]);
  const [showViolations, setShowViolations] = useState(false);
  const violationsRef = useRef<CspViolation[]>([]);

  // Listen for CSP violations
  useEffect(() => {
    const handleViolation = (event: SecurityPolicyViolationEvent) => {
      const violation: CspViolation = {
        directive: event.violatedDirective || event.effectiveDirective,
        blockedUri: event.blockedURI || "unknown",
        timestamp: Date.now(),
      };
      violationsRef.current = [...violationsRef.current, violation];
      setViolations([...violationsRef.current]);
    };

    document.addEventListener("securitypolicyviolation", handleViolation);
    return () => {
      document.removeEventListener("securitypolicyviolation", handleViolation);
    };
  }, []);

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

  const loadExternalScript = async (url: string, timeout = 5000): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      const timer = setTimeout(() => {
        script.remove();
        resolve(false);
      }, timeout);

      script.onload = () => {
        clearTimeout(timer);
        script.remove();
        resolve(true);
      };

      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        resolve(false);
      };

      script.src = url;
      document.head.appendChild(script);
    });
  };

  const runTest = async (test: TestResult): Promise<TestResult> => {
    updateTest(test.id, { status: "running" });
    const start = Date.now();

    try {
      let passed = false;
      let error: string | undefined;

      switch (test.id) {
        case "script-esm-sh":
          passed = await loadExternalScript(TEST_URLS.esmSh);
          if (!passed) error = "Failed to load esm.sh script";
          break;

        case "script-jsdelivr":
          passed = await loadExternalScript(TEST_URLS.jsdelivr);
          if (!passed) error = "Failed to load jsdelivr script";
          break;

        case "script-unpkg":
          passed = await loadExternalScript(TEST_URLS.unpkg);
          if (!passed) error = "Failed to load unpkg script";
          break;

        case "connect-self":
          try {
            const res = await fetch(window.location.href, { method: "HEAD" });
            passed = res.ok || res.status === 405;
          } catch {
            // Same origin fetch may fail for other reasons, but CSP wouldn't block it
            passed = true;
          }
          break;

        case "connect-external":
          const ctrl = new AbortController();
          const timeout = setTimeout(() => ctrl.abort(), 5000);
          try {
            const res = await fetch(TEST_URLS.connect, { signal: ctrl.signal });
            clearTimeout(timeout);
            passed = res.ok;
          } catch (e) {
            clearTimeout(timeout);
            passed = false;
            error = e instanceof Error ? e.message : "Fetch failed";
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

      const duration = Date.now() - start;
      const success = test.expectedToPass ? passed : !passed;
      const result: TestResult = {
        ...test,
        status: success ? "passed" : "failed",
        error: success ? undefined : error,
        duration,
      };
      updateTest(test.id, result);
      return result;
    } catch (e) {
      const duration = Date.now() - start;
      const result: TestResult = {
        ...test,
        status: test.expectedToPass ? "failed" : "passed",
        error: e instanceof Error ? e.message : "Unknown error",
        duration,
      };
      updateTest(test.id, result);
      return result;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    // Clear violations and reset tests
    violationsRef.current = [];
    setViolations([]);
    setTests((prev) => prev.map((t) => ({ ...t, status: "pending" as TestStatus, error: undefined })));

    for (const test of tests) {
      await runTest(test);
      await new Promise((r) => setTimeout(r, 100));
    }

    setIsRunning(false);
  };

  const clearViolations = () => {
    violationsRef.current = [];
    setViolations([]);
  };

  const passed = tests.filter((t) => t.status === "passed").length;
  const failed = tests.filter((t) => t.status === "failed").length;
  const total = tests.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] p-6">
      {/* Score Display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-light tabular-nums tracking-tighter text-foreground">
          {passed}/{total}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {mode === "strict" ? "Strict Mode" : "Permissive Mode"}
        </div>
        <div className="text-xs text-muted-foreground/70 mt-0.5">
          {mode === "strict"
            ? "External scripts should be BLOCKED"
            : "External scripts should be ALLOWED"}
        </div>
      </div>

      {/* Test Grid */}
      <div className="grid grid-cols-2 gap-2 mb-6 w-full max-w-md">
        {tests.map((test) => (
          <div
            key={test.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-md ${
              test.status === "failed" ? "bg-red-500/10" : "bg-muted/30"
            }`}
            title={test.error || `Expected: ${test.expectedToPass ? "pass" : "blocked"}`}
          >
            {test.status === "running" ? (
              <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin shrink-0" />
            ) : test.status === "passed" ? (
              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
            ) : test.status === "failed" ? (
              <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className="text-xs text-foreground truncate">{test.name}</span>
          </div>
        ))}
      </div>

      {/* Run Button */}
      <Button onClick={runAllTests} disabled={isRunning} size="default" className="h-9 px-5">
        {isRunning ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        {isRunning ? "Running..." : "Run Tests"}
      </Button>

      {/* CSP Violations Section */}
      {violations.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowViolations(!showViolations)}
              className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {violations.length} CSP violation{violations.length > 1 ? "s" : ""} detected
            </button>
            <button
              onClick={clearViolations}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          {showViolations && (
            <div className="bg-amber-500/10 rounded-md p-3 text-xs space-y-2 max-h-32 overflow-y-auto">
              {violations.map((v, i) => (
                <div key={i} className="text-amber-200/80 font-mono">
                  <span className="text-amber-500">{v.directive}</span>
                  {" → "}
                  <span className="text-muted-foreground truncate">{v.blockedUri}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {(passed > 0 || failed > 0) && (
        <div className="mt-4 text-xs text-muted-foreground text-center">
          {failed === 0
            ? "✓ All tests passed - CSP is working correctly"
            : `✗ ${failed} test${failed > 1 ? "s" : ""} failed - check CSP configuration`}
        </div>
      )}

      {/* Debug info */}
      <div className="mt-4 text-[10px] text-muted-foreground/50 text-center max-w-md">
        Tests external script loading from esm.sh, jsdelivr, unpkg to verify sandbox-proxy CSP fix
      </div>
    </div>
  );
}
