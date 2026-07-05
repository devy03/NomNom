import { mockRestaurants } from "@/data/mockRestaurants";
import type { Restaurant } from "@/types";

export interface AIResponse {
  text: string;
  restaurants?: Restaurant[];
}

function byTag(pool: Restaurant[], ...tags: string[]) {
  return pool.filter((r) =>
    tags.some((t) => r.tags.includes(t.toLowerCase()) || r.cuisine.toLowerCase() === t.toLowerCase())
  );
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

const rules: { test: RegExp; respond: (pool: Restaurant[]) => AIResponse }[] = [
  {
    test: /taco|mexican/i,
    respond: (pool) => ({
      text: "Tacos it is 🌮 Here's a great pick close by, budget-friendly, and rarely has a wait.",
      restaurants: byTag(pool, "Mexican"),
    }),
  },
  {
    test: /spicy|hot|heat/i,
    respond: (pool) => ({
      text: "Craving heat? These bring serious spice.",
      restaurants: byTag(pool, "spicy", "Indian", "Korean"),
    }),
  },
  {
    test: /burger/i,
    respond: (pool) => ({
      text: "Burger cravings, noted. Here are the best nearby, well within a $20 budget.",
      restaurants: byTag(pool, "burgers", "American"),
    }),
  },
  {
    test: /broke|cheap|budget|under \$?\d+|filling/i,
    respond: (pool) => ({
      text: "Say no more — here are great meals that won't hurt your wallet.",
      restaurants: [...pool].sort((a, b) => a.priceLevel - b.priceLevel).slice(0, 4),
    }),
  },
  {
    test: /30 min|quick|fast|no time|in a hurry|tired/i,
    respond: (pool) => ({
      text: "Short on time — these spots have the shortest wait right now.",
      restaurants: [...pool].filter((r) => r.openNow !== false).sort((a, b) => (a.waitTimeMins ?? 15) - (b.waitTimeMins ?? 15)).slice(0, 4),
    }),
  },
  {
    test: /veg(etarian|an)/i,
    respond: (pool) => ({
      text: "Got it, plant-based options coming up.",
      restaurants: byTag(pool, "vegetarian options", "Mediterranean"),
    }),
  },
  {
    test: /celebrat|birthday|promotion|anniversary/i,
    respond: (pool) => ({
      text: "Congratulations! 🎉 This calls for something special.",
      restaurants: byTag(pool, "celebrating", "French", "Italian"),
    }),
  },
  {
    test: /date|romantic|under \$50/i,
    respond: (pool) => ({
      text: "Setting the mood 🕯️ Our top picks for date night — quiet, intimate, and reliably good.",
      restaurants: byTag(pool, "date night", "romantic"),
    }),
  },
  {
    test: /don'?t want to cook|lazy/i,
    respond: (pool) => ({
      text: "Zero effort mode activated. These deliver fast and taste like comfort.",
      restaurants: byTag(pool, "comfort food", "budget"),
    }),
  },
  {
    test: /group|everyone|we need/i,
    respond: (pool) => ({
      text: "For a group, I'd lean toward places with variety on the menu so everyone finds something.",
      restaurants: byTag(pool, "group friendly", "vegetarian options"),
    }),
  },
  {
    test: /don'?t know|no idea|surprise|anything|pick for/i,
    respond: (pool) => ({
      text: "Totally normal — let me pick for you based on what's nearby and highly rated right now.",
      restaurants: pickRandom(pool, 3),
    }),
  },
  {
    test: /dessert|sweet/i,
    respond: (pool) => ({
      text: "Sweet tooth activated 🍦",
      restaurants: byTag(pool, "Dessert", "sweet"),
    }),
  },
  {
    test: /healthy|light|salad/i,
    respond: (pool) => ({
      text: "Keeping it light — these places balance flavor with freshness.",
      restaurants: byTag(pool, "healthy", "Mediterranean"),
    }),
  },
  {
    test: /sushi|japanese/i,
    respond: (pool) => ({
      text: "Sushi it is. Fair warning, the best spot tends to get busy.",
      restaurants: byTag(pool, "Japanese", "sushi"),
    }),
  },
  {
    test: /indian/i,
    respond: (pool) => ({
      text: "Indian food, coming up — sorted so the more affordable options are first.",
      restaurants: byTag(pool, "Indian").sort((a, b) => a.priceLevel - b.priceLevel),
    }),
  },
];

export function generateAIResponse(message: string, pool: Restaurant[] = mockRestaurants): AIResponse {
  for (const rule of rules) {
    if (rule.test.test(message)) {
      const res = rule.respond(pool);
      if (res.restaurants && res.restaurants.length > 0) return res;
    }
  }
  return {
    text: "Here's what I'd recommend based on what's popular nearby right now.",
    restaurants: pickRandom(pool, 3),
  };
}
