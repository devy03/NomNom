export const config = { runtime: "edge" };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
  });
}

// A significant token of the restaurant's name must appear in the matched
// Commons page title before we trust the match — Commons' own search
// relevance ranking isn't a substitute for confirming the result is
// actually about this restaurant. A wrong photo is worse than the
// placeholder for user trust, so false positives are rejected rather than
// risking a random unrelated image.
function isPlausibleMatch(name: string, pageTitle: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/^file:/, "")
      .replace(/\.[a-z0-9]+$/, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const nameTokens = normalize(name)
    .split(" ")
    .filter((t) => t.length >= 4); // skip short/generic words ("the", "cafe", "inc")
  if (nameTokens.length === 0) return false;

  const titleNormalized = normalize(pageTitle);
  return nameTokens.some((t) => titleNormalized.includes(t));
}

interface CommonsPage {
  title: string;
  imageinfo?: { url: string }[];
}

export default async function handler(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const location = searchParams.get("location") ?? "";
  if (!name) return json({ image: null });

  const query = `${name} ${location}`.trim();
  const apiUrl =
    "https://commons.wikimedia.org/w/api.php" +
    `?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}` +
    "&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url&format=json&origin=*";

  try {
    const res = await fetch(apiUrl, {
      headers: {
        // Wikimedia's rate-limit policy asks for a descriptive User-Agent
        // identifying the app (200 req/min vs. 10 req/min anonymous-by-IP).
        "User-Agent": "NomNom-App/1.0 (restaurant discovery app; group dining decisions)",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return json({ image: null });

    const data = await res.json();
    const pages: Record<string, CommonsPage> = data?.query?.pages ?? {};
    const candidates = Object.values(pages);

    for (const page of candidates) {
      const url = page.imageinfo?.[0]?.url;
      if (url && isPlausibleMatch(name, page.title)) {
        return json({ image: url });
      }
    }
    return json({ image: null });
  } catch {
    return json({ image: null });
  }
}
