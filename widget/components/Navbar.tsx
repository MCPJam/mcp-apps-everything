/**
 * Shared Navigation Bar
 * Shows back button when viewing individual widgets
 */

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { App } from "@modelcontextprotocol/ext-apps/react";

interface NavbarProps {
  app: App;
  onBack: () => void;
}

export function Navbar({ app, onBack }: NavbarProps) {
  const handleBack = () => {
    // Reset size to 400px when going back to dashboard
    app.sendSizeChange({ height: 400 });
    onBack();
  };

  return (
    <div className="absolute top-4 left-4 z-50">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 bg-background/80 backdrop-blur-sm border shadow-sm"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}