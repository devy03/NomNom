import type { Coordinates, Restaurant } from "@/types";
import { getRestaurantDetails } from "@/services/restaurantService";

const OG_IMAGE_CACHE_PREFIX = "nomnom:og-image:";

/** Fetches a website's Open Graph image via our own /api/og-image proxy
 * (arbitrary cross-origin HTML can't be read directly from the browser due
 * to CORS). Cached per-session since a site's OG image rarely changes. */
async function fetchOgImage(website: string): Promise<string | null> {
  const cacheKey = OG_IMAGE_CACHE_PREFIX + website;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) return cached === "null" ? null : cached;
  } catch {
    // ignore (private mode / storage full)
  }

  let image: string | null = null;
  try {
    const res = await fetch(`/api/og-image?url=${encodeURIComponent(website)}`);
    const data = await res.json();
    image = data.image ?? null;
  } catch {
    image = null;
  }

  try {
    sessionStorage.setItem(cacheKey, image ?? "null");
  } catch {
    // ignore
  }
  return image;
}

/** Fills in a real photo from the restaurant's own website when Geoapify
 * didn't already supply one (via wiki_and_media). No-op if a real photo is
 * already present or no website is known — restaurants with neither keep
 * the existing placeholder image. */
export async function enrichRestaurantPhoto(restaurant: Restaurant): Promise<Restaurant> {
  if (restaurant.photos.length > 0 || !restaurant.website) return restaurant;
  const image = await fetchOgImage(restaurant.website);
  if (!image) return restaurant;
  return { ...restaurant, image, photos: [image] };
}

/** Enriches the first `count` results of a nearby-search list with real
 * contact info (phone/website, via Geoapify place-details) and a real photo
 * (via the website's og:image). Runs in parallel; any individual failure
 * just leaves that restaurant unchanged. Restaurants beyond `count` are
 * left untouched to keep this fast and cheap. */
export async function enrichTopResults(
  restaurants: Restaurant[],
  count = 12,
  origin?: Coordinates
): Promise<Restaurant[]> {
  const top = restaurants.slice(0, count);
  const rest = restaurants.slice(count);

  const enriched = await Promise.all(
    top.map(async (r) => {
      try {
        const details = await getRestaurantDetails(r.id, origin);
        return enrichRestaurantPhoto(details);
      } catch {
        return r;
      }
    })
  );

  return [...enriched, ...rest];
}
