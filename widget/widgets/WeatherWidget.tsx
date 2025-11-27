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

const conditionConfig: Record<string, { emoji: string; gradient: string }> = {
  sunny: { emoji: "☀️", gradient: "from-amber-400 to-orange-500" },
  cloudy: { emoji: "☁️", gradient: "from-slate-400 to-slate-500" },
  rainy: { emoji: "🌧️", gradient: "from-blue-400 to-blue-600" },
  snowy: { emoji: "❄️", gradient: "from-cyan-200 to-blue-300" },
  stormy: { emoji: "⛈️", gradient: "from-slate-600 to-slate-800" },
  windy: { emoji: "💨", gradient: "from-teal-400 to-cyan-500" },
  default: { emoji: "🌤️", gradient: "from-sky-400 to-blue-500" },
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
        <div className="text-muted-foreground animate-pulse">Loading weather...</div>
      </div>
    );
  }

  const config = conditionConfig[weather.condition.toLowerCase()] || conditionConfig.default;

  return (
    <div className="p-4 space-y-4">
      {/* Main Weather Card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-6 text-white shadow-lg`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/90 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{weather.location}</span>
            </div>
            <div className="text-7xl font-light tracking-tighter">
              {weather.temperature}°
            </div>
            <div className="text-lg text-white/80 capitalize mt-1">
              {weather.condition}
            </div>
          </div>
          <div className="text-6xl">{config.emoji}</div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-white/70" />
            <span className="text-sm">
              <span className="font-semibold">{weather.humidity}%</span>
              <span className="text-white/70 ml-1">Humidity</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-white/70" />
            <span className="text-sm">
              <span className="font-semibold">{weather.wind} km/h</span>
              <span className="text-white/70 ml-1">Wind</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Detailed Forecast
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full transition-all hover:scale-105"
            onClick={() =>
              handleOpenLink(
                `https://www.google.com/search?q=weather+${encodeURIComponent(weather.location)}`,
                "Google"
              )
            }
          >
            <ExternalLink className="h-3 w-3 mr-1.5" />
            Google
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full transition-all hover:scale-105"
            onClick={() =>
              handleOpenLink(
                `https://www.accuweather.com/en/search-locations?query=${encodeURIComponent(weather.location)}`,
                "AccuWeather"
              )
            }
          >
            <ExternalLink className="h-3 w-3 mr-1.5" />
            AccuWeather
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full transition-all hover:scale-105"
            onClick={() =>
              handleOpenLink(`https://www.windy.com/?${weather.location}`, "Windy")
            }
          >
            <ExternalLink className="h-3 w-3 mr-1.5" />
            Windy
          </Button>
        </div>
      </div>

      {/* Success Toast */}
      {linkOpened && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2">
          ✓ Opened {linkOpened}
        </div>
      )}
    </div>
  );
}
