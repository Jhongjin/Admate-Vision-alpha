/**
 * 좌표 → 한글 주소 변환 (OpenStreetMap Nominatim, API 키 불필요)
 * 사용 정책: https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "AdmateVisionAlpha/1.0 (outdoor ad reporting; contact optional)";

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    addressdetails: "1",
  });
  try {
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        "Accept-Language": "ko",
        "User-Agent": USER_AGENT,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: {
        country?: string;
        state?: string;
        region?: string;
        city?: string;
        town?: string;
        village?: string;
        suburb?: string;
        neighbourhood?: string;
        road?: string;
      };
      display_name?: string;
    };
    if (data.address) {
      const a = data.address;
      const parts = [
        a.state ?? a.region,
        a.city ?? a.town ?? a.village,
        a.suburb ?? a.neighbourhood,
        a.road,
      ].filter(Boolean) as string[];
      if (parts.length > 0) return parts.join(" ");
    }
    return data.display_name ?? null;
  } catch {
    return null;
  }
}
