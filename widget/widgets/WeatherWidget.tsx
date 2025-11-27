/**
 * Weather Widget - Demonstrates ui/open-link API
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Droplets, Wind, MapPin } from "lucide-react";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind: number;
}

interface WeatherWidgetProps {
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
  openLink: (url: string) => Promise<void>;
}

const conditionConfig: Record<string, { emoji: string }> = {
  sunny: { emoji: "☀️" },
  cloudy: { emoji: "☁️" },
  rainy: { emoji: "🌧️" },
  snowy: { emoji: "❄️" },
  stormy: { emoji: "⛈️" },
  windy: { emoji: "💨" },
  default: { emoji: "🌤️" },
};

export function WeatherWidget({ toolInput, toolResult, openLink }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [linkOpened, setLinkOpened] = useState<string | null>(null);

  useEffect(() => {
    if (toolResult?.structuredContent) {
      const data = toolResult.structuredContent as WeatherData;
      setWeather(data);
    } else if (toolInput?.arguments) {
      const args = toolInput.arguments as Partial<WeatherData>;
      if (args.location) {
        setWeather({
          location: args.location,
          temperature: args.temperature ?? 20,
          condition: args.condition ?? "sunny",
          humidity: args.humidity ?? 50,
          wind: args.wind ?? 10,
        });
      }
    }
  }, [toolResult, toolInput]);

  const handleOpenLink = async (url: string, label: string) => {
    try {
      await openLink(url);
      setLinkOpened(label);
      setTimeout(() => setLinkOpened(null), 2000);
    } catch (err) {
      console.error("Failed to open link:", err);
    }
  };

  if (!weather) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-sm text-muted-foreground">Loading weather...</div>
      </div>
    );
  }

  const config = conditionConfig[weather.condition.toLowerCase()] || conditionConfig.default;

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <MapPin className="h-3.5 w-3.5" />
        <span>{weather.location}</span>
      </div>
      
      {/* Temperature */}
      <div className="relative mb-12">
        <div className="flex items-baseline gap-1">
          <div className="text-7xl font-light tabular-nums tracking-tighter text-foreground">
            {weather.temperature}
          </div>
          <div className="text-xl text-muted-foreground">°</div>
        </div>
        <div className="text-sm text-muted-foreground capitalize mt-2 text-center">
          {weather.condition}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-8 mb-12">
        <div className="flex items-center gap-2 text-sm">
          <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground">{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Wind className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground">{weather.wind} km/h</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() =>
            handleOpenLink(
              `https://www.google.com/search?q=weather+${encodeURIComponent(weather.location)}`,
              "Google"
            )
          }
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Google
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() =>
            handleOpenLink(
              `https://www.accuweather.com/en/search-locations?query=${encodeURIComponent(weather.location)}`,
              "AccuWeather"
            )
          }
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          AccuWeather
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() =>
            handleOpenLink(`https://www.windy.com/?${weather.location}`, "Windy")
          }
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Windy
        </Button>
      </div>

      {/* Success Toast */}
      {linkOpened && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-foreground text-background rounded-md text-xs shadow-lg border border-border">
          Opened {linkOpened}
        </div>
      )}
    </div>
  );
}
