export type GeocodeResult = {
  lat: number;
  lon: number;
  display_name: string;
};

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (!query) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "AetherisHealth/1.0 (+https://aetheris-health.local)",
      Referer: "https://aetheris-health.local",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const data = (await response.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const first = data[0];
  if (!first || !first.lat || !first.lon) {
    return null;
  }

  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    display_name: first.display_name || query,
  };
}
