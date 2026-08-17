import { HUB_CITIES } from "@/lib/hubCities";
import { haversineDistance } from "@/lib/haversineDistance";

// Given a raw lat/lon (from geolocation or a manually-searched city/zip),
// returns whichever HUB_CITIES entry is geographically closest — "nearest
// big city counts as local," so e.g. Porterville, CA resolves to
// Bakersfield rather than the more-populous-but-farther Sacramento. Pure
// distance, no media-market/DMA modeling — see hubCities.js for the known
// limitation that this can be a long way off in regions with no nearby hub
// yet.
export function resolveHubCity({ lat, lon }) {
  if (typeof lat !== "number" || typeof lon !== "number" || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  let nearest = null;
  let nearestDistance = Infinity;
  for (const city of HUB_CITIES) {
    const distance = haversineDistance({ lat, lon }, city);
    if (distance < nearestDistance) {
      nearest = city;
      nearestDistance = distance;
    }
  }
  return nearest;
}
