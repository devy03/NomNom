export const config = { runtime: "edge" };

// Basic SSRF hardening: this endpoint fetches an arbitrary URL server-side
// (the restaurant's own website, sourced from Geoapify/OSM data) — block the
// obvious private/loopback/link-local hosts so it can't be used to probe
// internal network services or cloud metadata endpoints.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0" || h === "::1") return true;
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true; // includes cloud metadata (169.254.169.254)
  return false;
}

function extractMetaImage(html: string, baseUrl: URL): string | null {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  const getAttr = (tag: string, attr: string): string | undefined => {
    const m = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i"));
    return m?.[1];
  };
  const wanted = ["og:image", "og:image:url", "twitter:image"];

  for (const tag of metaTags) {
    const prop = (getAttr(tag, "property") ?? getAttr(tag, "name"))?.toLowerCase();
    if (prop && wanted.includes(prop)) {
      const content = getAttr(tag, "content");
      if (content) {
        try {
          return new URL(content, baseUrl).toString();
        } catch {
          continue;
        }
      }
    }
  }
  return null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
  });
}

export default async function handler(request: Request): Promise<Response> {
  const target = new URL(request.url).searchParams.get("url");
  if (!target) return json({ image: null });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return json({ image: null });
  }

  if (!["http:", "https:"].includes(parsed.protocol) || isBlockedHost(parsed.hostname)) {
    return json({ image: null });
  }

  try {
    const res = await fetch(parsed.toString(), {
      // A real browser UA + the headers a real browser sends — restaurant
      // sites are meant to expose these Open Graph tags for link-preview
      // crawlers (Slack/Discord/etc. do the same); an obviously-bot UA
      // instead trips some CDNs' bot-mitigation into silently serving a
      // stripped/challenge page while still returning 200.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return json({ image: null });
    const html = await res.text();
    // A genuine page with real content is never this small — a challenge/
    // interstitial page (Cloudflare, etc.) typically is. Treat it the same
    // as "no image tag found" rather than trusting the 200 status alone.
    if (html.length < 500) return json({ image: null });
    return json({ image: extractMetaImage(html, parsed) });
  } catch {
    return json({ image: null });
  }
}
