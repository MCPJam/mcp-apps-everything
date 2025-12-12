/**
 * Dashboard Widget - Shows all available widgets for navigation
 */

import {
  MousePointerClick,
  ExternalLink,
  MessageSquare,
  Shield,
  Maximize2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WidgetType } from "../App";

interface DashboardProps {
  onNavigate: (widget: WidgetType) => void;
}

const WIDGETS = [
  {
    id: "tool-call" as WidgetType,
    name: "Tool Call",
    description: "Demonstrates tools/call API",
    icon: MousePointerClick
  },
  {
    id: "open-link" as WidgetType,
    name: "Open Link",
    description: "Demonstrates the ui/open-link API",
    icon: ExternalLink
  },
  {
    id: "message" as WidgetType,
    name: "Message",
    description: "Demonstrates the ui/message API",
    icon: MessageSquare
  },
  {
    id: "csp-test" as WidgetType,
    name: "CSP Test",
    description: "Tests Content Security Policy",
    icon: Shield
  },
  {
    id: "size-change" as WidgetType,
    name: "Size Change",
    description: "Demonstrates the ui/notifications/size-change API",
    icon: Maximize2
  },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">MCP Apps Dashboard</h1>
        <p className="text-muted-foreground">
          Select a widget to explore different MCP APIs and capabilities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {WIDGETS.map((widget) => {
          const Icon = widget.icon;
          return (
            <Card
              key={widget.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onNavigate(widget.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{widget.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{widget.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
