/**
 * Weather Widget - Demonstrates ui/open-link API
 *
 * Features:
 * - Opens external links via ui/open-link
 * - Shows tool input (location, weather data)
 * - Theme-aware styling with weather icons
 */

import { useState, useEffect } from "react";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind: number;
}

interface WeatherWidgetProps {
  isDark: boolean;
  toolInput: { arguments: Record<string, unknown> } | null;
  toolResult: { structuredContent?: Record<string, unknown> } | null;
  openLink: (url: string) => Promise<void>;
}

const weatherIcons: Record<string, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  snowy: "❄️",
  stormy: "⛈️",
  windy: "💨",
  default: "🌤️",
};

export function WeatherWidget({ isDark, toolInput, toolResult, openLink }: WeatherWidgetProps) {
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

  const linkStyle = {
    display: "inline-block",
    padding: "0.4rem 0.8rem",
    margin: "0.25rem",
    background: isDark ? "#2563eb" : "#3b82f6",
    color: "#fff",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    textDecoration: "none",
    border: "none",
  };

  if (!weather) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
        Loading weather data...
      </div>
    );
  }

  const icon = weatherIcons[weather.condition.toLowerCase()] || weatherIcons.default;

  return (
    <div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", opacity: 0.7 }}>
        ui/open-link Demo
      </h3>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "3rem" }}>{icon}</span>
        <div>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{weather.temperature}°C</div>
          <div style={{ opacity: 0.8, textTransform: "capitalize" }}>{weather.condition}</div>
        </div>
      </div>

      <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
        📍 {weather.location}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          marginBottom: "1rem",
          fontSize: "0.9rem",
        }}
      >
        <div>💧 Humidity: {weather.humidity}%</div>
        <div>💨 Wind: {weather.wind} km/h</div>
      </div>

      <div style={{ borderTop: `1px solid ${isDark ? "#444" : "#ddd"}`, paddingTop: "1rem" }}>
        <div style={{ marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>
          Open External Links:
        </div>
        <div>
          <button
            onClick={() =>
              handleOpenLink(
                `https://www.google.com/search?q=weather+${encodeURIComponent(weather.location)}`,
                "Google Weather"
              )
            }
            style={linkStyle}
          >
            🔍 Google Weather
          </button>
          <button
            onClick={() =>
              handleOpenLink(
                `https://www.accuweather.com/en/search-locations?query=${encodeURIComponent(weather.location)}`,
                "AccuWeather"
              )
            }
            style={linkStyle}
          >
            🌡️ AccuWeather
          </button>
          <button
            onClick={() =>
              handleOpenLink(`https://www.windy.com/?${weather.location}`, "Windy.com")
            }
            style={linkStyle}
          >
            🌬️ Windy.com
          </button>
        </div>
        {linkOpened && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              background: isDark ? "#166534" : "#dcfce7",
              color: isDark ? "#fff" : "#166534",
              borderRadius: "4px",
              fontSize: "0.85rem",
            }}
          >
            ✓ Opened: {linkOpened}
          </div>
        )}
      </div>
    </div>
  );
}
