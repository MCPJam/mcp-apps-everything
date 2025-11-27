/**
 * Weather Widget - Demonstrates ui/open-link API
 *
 * Features:
 * - Opens external links via ui/open-link
 * - Shows tool input (location, weather data)
 * - Theme-aware styling with weather icons
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

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

const weatherIcons: Record<string, string> = {
  sunny: "sun",
  cloudy: "cloud",
  rainy: "cloud-rain",
  snowy: "snowflake",
  stormy: "cloud-lightning",
  windy: "wind",
  default: "cloud-sun",
};

export function WeatherWidget({ toolInput, toolResult, openLink }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [linkOpened, setLinkOpened] = useState<string | null>(null);

  // Initialize from tool result
  useEffect(() => {
    if (toolResult?.structuredContent) {
      const data = toolResult.structuredContent as WeatherData;
      setWeather(data);
    } else if (toolInput?.arguments) {
      // Also check tool input for initial data
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
      <div className="text-center py-8 text-muted-foreground">
        Loading weather data...
      </div>
    );
  }

  const conditionEmoji = {
    sunny: "&#x2600;&#xFE0F;",
    cloudy: "&#x2601;&#xFE0F;",
    rainy: "&#x1F327;&#xFE0F;",
    snowy: "&#x2744;&#xFE0F;",
    stormy: "&#x26C8;&#xFE0F;",
    windy: "&#x1F4A8;",
    default: "&#x1F324;&#xFE0F;",
  }[weather.condition.toLowerCase()] || "&#x1F324;&#xFE0F;";

  return (
    <div>
      <h3 className="text-sm text-muted-foreground mb-2">ui/open-link Demo</h3>

      <div className="flex items-center gap-4 mb-4">
        <span className="text-5xl" dangerouslySetInnerHTML={{ __html: conditionEmoji }} />
        <div>
          <div className="text-4xl font-bold">{weather.temperature}&#xB0;C</div>
          <div className="text-muted-foreground capitalize">{weather.condition}</div>
        </div>
      </div>

      <div className="text-lg mb-2">
        &#x1F4CD; {weather.location}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <span>&#x1F4A7;</span> Humidity: {weather.humidity}%
        </div>
        <div className="flex items-center gap-1">
          <span>&#x1F4A8;</span> Wind: {weather.wind} km/h
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="font-semibold text-sm mb-3">Open External Links:</div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() =>
              handleOpenLink(
                `https://www.google.com/search?q=weather+${encodeURIComponent(weather.location)}`,
                "Google Weather"
              )
            }
          >
            <ExternalLink className="size-3" />
            Google Weather
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              handleOpenLink(
                `https://www.accuweather.com/en/search-locations?query=${encodeURIComponent(weather.location)}`,
                "AccuWeather"
              )
            }
          >
            <ExternalLink className="size-3" />
            AccuWeather
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              handleOpenLink(`https://www.windy.com/?${weather.location}`, "Windy.com")
            }
          >
            <ExternalLink className="size-3" />
            Windy.com
          </Button>
        </div>
        {linkOpened && (
          <div className="mt-3 p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-md text-sm">
            &#x2713; Opened: {linkOpened}
          </div>
        )}
      </div>
    </div>
  );
}
