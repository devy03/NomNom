import type { Coordinates, Restaurant } from "@/types";
import { getRestaurantDetails } from "@/services/restaurantService";

const OG_IMAGE_CACHE_PREFIX = "nomnom:og-image:";
const COMMONS_CACHE_PREFIX = "nomnom:commons-photo:";

/** Small helper: cache a lookup result in sessionStorage under a prefixed
 * key, treating the literal string "null" as a cached miss. */
async function cachedLookup(cacheKey: string, run: () => Promise<string | null>): Promise<string | null> {
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) return cached === "null" ? null : cached;
  } catch {
    // ignore (private mode / storage full)
  }

  const image = await run().catch(() => null);

  try {
    sessionStorage.setItem(cacheKey, image ?? "null");
  } catch {
    // ignore
  }
  return image;
}

/** Fetches a website's Open Graph image via our own /api/og-image proxy
 * (arbitrary cross-origin HTML can't be read directly from the browser due
 * to CORS). Cached per-session since a site's OG image rarely changes. */
function fetchOgImage(website: string): Promise<string | null> {
  return cachedLookup(OG_IMAGE_CACHE_PREFIX + website, async () => {
    const res = await fetch(`/api/og-image?url=${encodeURIComponent(website)}`);
    const data = await res.json();
    return data.image ?? null;
  });
}

/** Fallback photo source when a restaurant has no website, or its website
 * had no og:image tag: searches Wikimedia Commons (free, legitimate) for a
 * real photo. Coverage is realistically low for small independent
 * restaurants — Commons is built around notable subjects — but it's a
 * reasonable second chance for chains/landmarks at zero cost. */
function fetchCommonsPhoto(name: string, location: string): Promise<string | null> {
  return cachedLookup(COMMONS_CACHE_PREFIX + name + "|" + location, async () => {
    const res = await fetch(`/api/commons-photo?name=${encodeURIComponent(name)}&location=${encodeURIComponent(location)}`);
    const data = await res.json();
    return data.image ?? null;
  });
}

/** Fills in a real photo, trying progressively less-precise free sources:
 * (1) no-op if Geoapify's own wiki_and_media already gave one, (2) the
 * restaurant's own website og:image when a website is known, (3) Wikimedia
 * Commons as a last resort. Restaurants with none of these keep the
 * existing placeholder image — the accepted, honest end state for a
 * restaurant with no free photo source anywhere. */
export async function enrichRestaurantPhoto(restaurant: Restaurant): Promise<Restaurant> {
  if (restaurant.photos.length > 0) return restaurant;

  if (restaurant.website) {
    const image = await fetchOgImage(restaurant.website);
    if (image) return { ...restaurant, image, photos: [image] };
  }

  const commonsImage = await fetchCommonsPhoto(restaurant.name, restaurant.address);
  if (commonsImage) return { ...restaurant, image: commonsImage, photos: [commonsImage] };

  return restaurant;
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
