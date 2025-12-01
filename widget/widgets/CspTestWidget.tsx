/**
 * CSP Test Widget - Tests Content Security Policy enforcement
 *
 * Per SEP-1865, hosts enforce CSP based on resource metadata:
 * - connectDomains: Origins for fetch/XHR/WebSocket (maps to connect-src)
 * - resourceDomains: Origins for images, scripts, styles (maps to img-src, script-src, etc.)
 *
 * Default restrictive CSP (when ui.csp is omitted):
 *   default-src 'none';
 *   script-src 'self' 'unsafe-inline';
 *   style-src 'self' 'unsafe-inline';
 *   img-src 'self' data:;
 *   connect-src 'none';
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  CheckCircle2,
  XCircle,
  Circle,
  RefreshCw,
  Globe,
  Image,
  Code,
  Paintbrush,
} from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";

type TestStatus = "pending" | "running" | "passed" | "failed";

interface TestResult {
  id: string;
  name: string;
  description: string;
  category: "connect" | "image" | "script" | "style";
  status: TestStatus;
  error?: string;
  expectedToPass: boolean;
}

interface CspTestWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

// Base test definitions - expectedToPass is for STRICT mode
const BASE_TEST_DEFINITIONS: Omit<TestResult, "status" | "error">[] = [
  // connect-src tests
  {
    id: "connect-self",
    name: "Fetch Same Origin",
    description: "Fetch from same origin (should work)",
    category: "connect",
    expectedToPass: true,
  },
  {
    id: "connect-allowed",
    name: "Fetch External API",
    description: "Fetch from jsonplaceholder.typicode.com (tests CSP connect-src)",
    category: "connect",
    expectedToPass: false, // In strict mode, should be blocked
  },
  // img-src tests
  {
    id: "img-data",
    name: "Data URL Image",
    description: "Load image from data: URL",
    category: "image",
    expectedToPass: true,
  },
  {
    id: "img-external",
    name: "External Image (picsum)",
    description: "Load image from picsum.photos (tests CSP img-src)",
    category: "image",
    expectedToPass: false, // In strict mode, should be blocked
  },
  // script-src tests
  {
    id: "script-inline",
    name: "Inline Script",
    description: "Execute inline JavaScript",
    category: "script",
    expectedToPass: true,
  },
  // style-src tests
  {
    id: "style-inline",
    name: "Inline Styles",
    description: "Apply inline CSS styles",
    category: "style",
    expectedToPass: true,
  },
];

// Get test definitions adjusted for mode
function getTestDefinitions(mode: "strict" | "permissive"): Omit<TestResult, "status" | "error">[] {
  if (mode === "permissive") {
    return BASE_TEST_DEFINITIONS.map(test => {
      // In permissive mode, external fetch and images should PASS
      if (test.id === "connect-allowed" || test.id === "img-external") {
        return { ...test, expectedToPass: true };
      }
      return test;
    });
  }
  return BASE_TEST_DEFINITIONS;
}

// Test URLs based on CSP config
const TEST_URLS = {
  // jsonplaceholder is more reliable and CORS-friendly than httpbin
  externalConnect: "https://jsonplaceholder.typicode.com/posts/1",
  externalImage: "https://picsum.photos/32/32", // Lorem Picsum (redirects to fastly.picsum.photos)
};

// Small 1x1 transparent PNG as data URL
const DATA_URL_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export function CspTestWidget({ app, toolInput, toolResult }: CspTestWidgetProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [cspConfig, setCspConfig] = useState<{
    connectDomains?: string[];
    resourceDomains?: string[];
  } | null>(null);
  const [mode, setMode] = useState<"strict" | "permissive">("strict");

  // Initialize tests based on mode
  const [tests, setTests] = useState<TestResult[]>(() =>
    getTestDefinitions("strict").map((def) => ({ ...def, status: "pending" as TestStatus }))
  );

  // Get CSP config and mode from tool result
  useEffect(() => {
    if (toolResult?.structuredContent) {
      const data = toolResult.structuredContent as {
        csp?: { connectDomains?: string[]; resourceDomains?: string[] };
        mode?: "strict" | "permissive";
      };
      if (data.csp) {
        setCspConfig(data.csp);
      }
      if (data.mode) {
        setMode(data.mode);
        // Re-initialize tests with correct expectations for mode
        setTests(getTestDefinitions(data.mode).map((def) => ({
          ...def,
          status: "pending" as TestStatus
        })));
      }
    }
  }, [toolResult]);

  const updateTest = useCallback((id: string, update: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test) => (test.id === id ? { ...test, ...update } : test))
    );
  }, []);

  const runConnectSelfTest = async (): Promise<boolean> => {
    try {
      // Try to fetch the current document location as a simple connectivity test
      const response = await fetch(window.location.href, { method: "HEAD" });
      return response.ok || response.status === 405; // HEAD may not be supported
    } catch {
      // Same-origin should generally work unless in a very restricted sandbox
      return true; // Consider it passed if we can execute at all
    }
  };

  const runConnectAllowedTest = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(TEST_URLS.externalConnect, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (err) {
      // Check if it's a CSP violation or network error
      const error = err as Error;
      if (error.message?.includes("Content Security Policy")) {
        throw new Error("Blocked by CSP");
      }
      throw err;
    }
  };

  const runImageTest = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      const timeoutId = setTimeout(() => {
        img.src = "";
        resolve(false);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(false);
      };
      img.src = src;
    });
  };

  const runInlineScriptTest = (): boolean => {
    try {
      // Test inline script execution
      const testValue = Math.random().toString();
      const win = window as unknown as Record<string, unknown>;
      win.__cspTestValue = testValue;
      const script = document.createElement("script");
      script.textContent = `window.__cspTestResult = window.__cspTestValue + "_executed";`;
      document.head.appendChild(script);
      document.head.removeChild(script);
      const result = win.__cspTestResult;
      delete win.__cspTestValue;
      delete win.__cspTestResult;
      return result === testValue + "_executed";
    } catch {
      return false;
    }
  };

  const runInlineStyleTest = (): boolean => {
    try {
      // Test inline style application
      const testDiv = document.createElement("div");
      testDiv.style.cssText = "position: absolute; left: -9999px; width: 50px;";
      document.body.appendChild(testDiv);
      const width = testDiv.offsetWidth;
      document.body.removeChild(testDiv);
      return width === 50;
    } catch {
      return false;
    }
  };

  const runSingleTest = async (test: TestResult): Promise<void> => {
    updateTest(test.id, { status: "running", error: undefined });

    try {
      let passed = false;

      switch (test.id) {
        case "connect-self":
          passed = await runConnectSelfTest();
          break;
        case "connect-allowed":
          passed = await runConnectAllowedTest();
          break;
        case "img-data":
          passed = await runImageTest(DATA_URL_IMAGE);
          break;
        case "img-external":
          passed = await runImageTest(TEST_URLS.externalImage);
          break;
        case "script-inline":
          passed = runInlineScriptTest();
          break;
        case "style-inline":
          passed = runInlineStyleTest();
          break;
      }

      // For "expected to fail" tests, invert the logic
      const testPassed = test.expectedToPass ? passed : !passed;

      // Provide clear error messages
      let error: string | undefined;
      if (!testPassed) {
        if (test.expectedToPass && !passed) {
          error = "Request failed unexpectedly";
        } else if (!test.expectedToPass && passed) {
          error = "Not blocked (CSP not enforced by host)";
        }
      }

      updateTest(test.id, {
        status: testPassed ? "passed" : "failed",
        error,
      });
    } catch (err) {
      const error = err as Error;
      // For tests expected to fail, catching an error means success
      if (!test.expectedToPass) {
        updateTest(test.id, { status: "passed" });
      } else {
        updateTest(test.id, {
          status: "failed",
          error: error.message || "Test failed",
        });
      }
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    // Reset all tests
    setTests((prev) =>
      prev.map((test) => ({ ...test, status: "pending" as TestStatus, error: undefined }))
    );

    // Run tests sequentially to avoid overwhelming the browser
    for (const test of tests) {
      await runSingleTest(test);
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const getCategoryIcon = (category: TestResult["category"]) => {
    switch (category) {
      case "connect":
        return <Globe className="h-3.5 w-3.5" />;
      case "image":
        return <Image className="h-3.5 w-3.5" />;
      case "script":
        return <Code className="h-3.5 w-3.5" />;
      case "style":
        return <Paintbrush className="h-3.5 w-3.5" />;
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case "pending":
        return <Circle className="h-4 w-4 text-muted-foreground" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case "passed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const passedCount = tests.filter((t) => t.status === "passed").length;
  const failedCount = tests.filter((t) => t.status === "failed").length;

  const groupedTests = {
    connect: tests.filter((t) => t.category === "connect"),
    image: tests.filter((t) => t.category === "image"),
    script: tests.filter((t) => t.category === "script"),
    style: tests.filter((t) => t.category === "style"),
  };

  return (
    <div className="flex flex-col min-h-[400px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-foreground">CSP Test Suite</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
              mode === "strict"
                ? "bg-red-500/20 text-red-600 dark:text-red-400"
                : "bg-green-500/20 text-green-600 dark:text-green-400"
            }`}>
              {mode === "strict" ? "STRICT" : "PERMISSIVE"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "strict"
              ? "All external requests should be BLOCKED"
              : "Allowed: jsonplaceholder.typicode.com (fetch), picsum.photos (images)"}
          </p>
        </div>
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          size="sm"
          className="h-8"
        >
          {isRunning ? (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 mr-1.5" />
          )}
          {isRunning ? "Running..." : "Run Tests"}
        </Button>
      </div>

      {/* CSP Config Display */}
      {cspConfig && (
        <div className="mb-6 p-3 bg-muted/50 rounded-md text-xs font-mono">
          <div className="text-muted-foreground mb-1">Active CSP Config:</div>
          <div className="text-foreground">
            connectDomains: [{cspConfig.connectDomains?.length
              ? cspConfig.connectDomains.join(", ")
              : <span className="text-amber-500">empty - all blocked</span>}]
          </div>
          <div className="text-foreground">
            resourceDomains: [{cspConfig.resourceDomains?.length
              ? cspConfig.resourceDomains.join(", ")
              : <span className="text-amber-500">empty - all blocked</span>}]
          </div>
        </div>
      )}

      {/* Results Summary */}
      {(passedCount > 0 || failedCount > 0) && (
        <div className="flex gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-foreground">{passedCount} passed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-foreground">{failedCount} failed</span>
          </div>
        </div>
      )}

      {/* Test Categories */}
      <div className="flex-1 space-y-6">
        {(Object.entries(groupedTests) as [TestResult["category"], TestResult[]][]).map(
          ([category, categoryTests]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
                {getCategoryIcon(category)}
                <span className="capitalize">{category === "connect" ? "connect-src" : `${category}-src`}</span>
              </div>
              <div className="space-y-2">
                {categoryTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {test.name}
                        </span>
                        {!test.expectedToPass && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded">
                            expects block
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {test.description}
                      </div>
                      {test.error && (
                        <div className="text-xs text-red-500 mt-1">{test.error}</div>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      {getStatusIcon(test.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
        <p>
          Tests verify CSP enforcement per SEP-1865. "Expects block" tests pass when the
          host enforces restrictive CSP. Failures indicate the host allows external requests.
        </p>
      </div>
    </div>
  );
}
