import { Sun, Moon, CloudSun, CloudMoon, Cloud, Cloudy, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from "lucide-react";

// OpenWeatherMap's condition `id` groups by leading digit(s) — stable,
// long-documented ranges (https://openweathermap.org/weather-conditions),
// not something that needs per-exact-code granularity for a compact widget.
// `isDay` picks the day/night variant where one exists.
export function getWeatherDisplay(id, isDay = true) {
  if (id >= 200 && id < 300) return { label: "Thunderstorm", Icon: CloudLightning };
  if (id >= 300 && id < 400) return { label: "Drizzle", Icon: CloudDrizzle };
  if (id >= 500 && id < 600) return { label: "Rain", Icon: CloudRain };
  if (id >= 600 && id < 700) return { label: "Snow", Icon: CloudSnow };
  if (id >= 700 && id < 800) return { label: "Haze", Icon: CloudFog };
  if (id === 800) return isDay ? { label: "Clear", Icon: Sun } : { label: "Clear", Icon: Moon };
  if (id === 801) return isDay ? { label: "Partly cloudy", Icon: CloudSun } : { label: "Partly cloudy", Icon: CloudMoon };
  if (id >= 802 && id < 900) return { label: "Cloudy", Icon: Cloud };
  return { label: "Unknown", Icon: Cloudy };
}
