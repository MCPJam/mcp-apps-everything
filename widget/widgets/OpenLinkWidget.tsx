/**
 * Open Link Widget - Demonstrates ui/open-link API
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Droplets, Wind, MapPin, Loader2 } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps/react";

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}

interface OpenLinkWidgetProps {
  app: App;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
}

// Map Open-Meteo weather codes to human-readable conditions
function getWeatherCondition(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

export function OpenLinkWidget({ app, toolInput, toolResult }: OpenLinkWidgetProps) {
  const [location, setLocation] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkOpened, setLinkOpened] = useState<string | null>(null);

  useEffect(() => {
    if (toolResult?.structuredContent) {
      const data = toolResult.structuredContent as { location?: string };
      if (data.location) setLocation(data.location);
    } else if (toolInput?.arguments) {
      const args = toolInput.arguments as { location?: string };
      if (args.location) setLocation(args.location);
    }
  }, [toolResult, toolInput]);

  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        // First, geocode the location to get coordinates
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
        );
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
          setError("Location not found");
          setLoading(false);
          return;
        }

        const { latitude, longitude } = geoData.results[0];

        // Then fetch weather data
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
        );
        const weatherData = await weatherResponse.json();

        if (weatherData.current) {
          setWeather({
            temperature: Math.round(weatherData.current.temperature_2m),
            humidity: weatherData.current.relative_humidity_2m,
            windSpeed: Math.round(weatherData.current.wind_speed_10m),
            condition: getWeatherCondition(weatherData.current.weather_code),
          });
        }
      } catch (err) {
        console.error("Failed to fetch weather:", err);
        setError("Failed to fetch weather data");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  const handleOpenLink = async (url: string, label: string) => {
    try {
      // Open link directly via the SDK
      await app.sendOpenLink({ url });
      setLinkOpened(label);
      setTimeout(() => setLinkOpened(null), 2000);
    } catch (err) {
      console.error("Failed to open link:", err);
    }
  };

  if (!location) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-sm text-muted-foreground">No location provided</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
        <div className="text-sm text-muted-foreground mb-4">{error}</div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() =>
              handleOpenLink(
                `https://www.google.com/search?q=weather+${encodeURIComponent(location)}`,
                "Google"
              )
            }
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Search on Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <MapPin className="h-3.5 w-3.5" />
        <span>{location}</span>
      </div>

      {/* Temperature */}
      {weather && (
        <>
          <div className="relative mb-12">
            <div className="flex items-baseline gap-1">
              <div className="text-7xl font-light tabular-nums tracking-tighter text-foreground">
                {weather.temperature}
              </div>
              <div className="text-xl text-muted-foreground">°C</div>
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
              <span className="text-foreground">{weather.windSpeed} km/h</span>
            </div>
          </div>
        </>
      )}

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() =>
            handleOpenLink(
              `https://www.google.com/search?q=weather+${encodeURIComponent(location)}`,
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
              `https://www.accuweather.com/en/search-locations?query=${encodeURIComponent(location)}`,
              "AccuWeather"
            )
          }
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          AccuWeather
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
