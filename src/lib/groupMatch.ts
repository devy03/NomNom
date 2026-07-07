import type { DiningStyle, GroupMatchBreakdown, GroupMemberPreferences, Restaurant } from "@/types";
import { estimateAveragePrice } from "@/services/restaurantService";

function memberLabel(m: GroupMemberPreferences) {
  return m.guestName || "A member";
}

// ── Cuisine heuristics ──────────────────────────────────────────────────────
// Google gives us a cuisine string + tags; we map those to rough dietary/flavor
// signals. These are intentionally broad — the goal is sensible ranking, not
// perfect nutrition data.
const SPICY_CUISINES = ["indian", "thai", "korean", "mexican", "sichuan", "szechuan", "ethiopian", "hunan"];
const VEG_FRIENDLY_CUISINES = ["indian", "mediterranean", "thai", "vegetarian", "vegan", "middle eastern", "lebanese", "ethiopian"];
const HALAL_FRIENDLY_CUISINES = ["indian", "middle eastern", "mediterranean", "turkish", "pakistani", "persian", "afghan", "lebanese", "halal"];
const CARB_HEAVY_CUISINES = ["pizza", "bakery", "sandwich", "italian", "pasta", "noodle", "ramen", "burger", "hamburger", "deli"];
const DAIRY_HEAVY_CUISINES = ["pizza", "ice cream", "bakery", "cheese", "italian"];

function textBag(r: Restaurant): string {
  return `${r.cuisine} ${r.name} ${r.tags.join(" ")}`.toLowerCase();
}

function hasAny(bag: string, needles: string[]): boolean {
  return needles.some((n) => bag.includes(n));
}

/** Returns a [-1, 1] fit for a single dietary restriction: 1 = clearly a good
 * fit, -1 = clearly a poor fit, 0 = neutral/unknown. */
function dietaryFit(restriction: string, bag: string): number {
  switch (restriction.toLowerCase()) {
    case "vegetarian":
    case "vegan":
      if (hasAny(bag, ["vegetarian", "vegan", "plant"])) return 1;
      return hasAny(bag, VEG_FRIENDLY_CUISINES) ? 0.4 : -1;
    case "halal":
      if (bag.includes("halal")) return 1;
      return hasAny(bag, HALAL_FRIENDLY_CUISINES) ? 0.5 : -0.4;
    case "kosher":
      if (hasAny(bag, ["kosher", "jewish", "deli"])) return 1;
      return -0.4;
    case "keto":
      if (hasAny(bag, ["steak", "bbq", "barbecue", "seafood", "grill", "korean"])) return 0.7;
      return hasAny(bag, CARB_HEAVY_CUISINES) ? -0.8 : 0;
    case "dairy-free":
      return hasAny(bag, DAIRY_HEAVY_CUISINES) ? -0.7 : 0.2;
    case "nut-free":
      return hasAny(bag, ["thai", "peanut"]) ? -0.6 : 0.2;
    case "gluten-free":
      if (bag.includes("gluten")) return 1;
      return hasAny(bag, CARB_HEAVY_CUISINES) ? -0.7 : 0.2;
    default:
      return 0;
  }
}

function diningStyleFit(style: DiningStyle, bag: string): number {
  switch (style) {
    case "takeout":
      return hasAny(bag, ["takeaway", "takeout", "fast food", "meal takeaway"]) ? 1 : 0.4;
    case "delivery":
      return hasAny(bag, ["delivery", "meal delivery"]) ? 1 : 0.4;
    case "cook-at-home":
      return 0.5; // restaurants can't really satisfy this; stay neutral
    case "dine-in":
    default:
      return hasAny(bag, ["fast food", "meal takeaway"]) ? 0.6 : 1;
  }
}

function moodFit(r: Restaurant, mood: string): number {
  const m = mood.toLowerCase();
  const price = r.priceLevel;
  if (m === "celebrating" || m === "date night") {
    return (r.rating >= 4.3 ? 0.6 : 0.2) + (price >= 2 ? 0.4 : 0);
  }
  if (m === "tired" || m === "sick") {
    // want close & simple/comforting
    const close = (r.distanceMiles ?? 99) <= 3 ? 0.6 : 0.2;
    return close + (price <= 2 ? 0.4 : 0);
  }
  return 0.5; // Happy / Stressed / Staying Home — no strong steer
}

const WEIGHTS = {
  budget: 0.22,
  distance: 0.15,
  cravings: 0.2,
  dietary: 0.13,
  dining: 0.08,
  spice: 0.1,
  mood: 0.07,
  rating: 0.05,
};

interface MemberScore {
  score: number; // normalized 0..1
  reason: string;
  happy: boolean;
}

function scoreForMember(r: Restaurant, m: GroupMemberPreferences): MemberScore {
  const label = memberLabel(m);
  const bag = textBag(r);
  const avgPrice = estimateAveragePrice(r);

  // Track the single most salient reason to surface in the UI.
  let reason = `works for ${label}`;
  let happy = true;

  // Budget (0..1)
  let budget: number;
  if (avgPrice <= m.budgetMax) {
    budget = 1;
    reason = `stays under ${label}'s $${m.budgetMax} budget`;
  } else {
    budget = Math.max(0, 1 - (avgPrice - m.budgetMax) / m.budgetMax);
    happy = false;
    reason = `runs over ${label}'s $${m.budgetMax} budget`;
  }

  // Distance (0..1)
  let distance = 0.6;
  if (r.distanceMiles != null && m.maxDistanceMiles) {
    if (r.distanceMiles <= m.maxDistanceMiles) {
      distance = 1;
    } else {
      distance = Math.max(0, 1 - (r.distanceMiles - m.maxDistanceMiles) / m.maxDistanceMiles);
      happy = false;
      reason = `is farther than ${label} wanted to travel`;
    }
  }

  // Cravings (0..1)
  const craved = m.cravings.some(
    (c) => r.cuisine.toLowerCase() === c.toLowerCase() || bag.includes(c.toLowerCase())
  );
  const cravings = craved ? 1 : m.cravings.length === 0 ? 0.5 : 0.2;
  if (craved) reason = `matches what ${label} was craving`;

  // Dietary (0..1) — average fit across the member's restrictions
  let dietary = 0.6;
  if (m.dietaryRestrictions.length > 0) {
    const fits = m.dietaryRestrictions.map((d) => dietaryFit(d, bag));
    const avgFit = fits.reduce((a, b) => a + b, 0) / fits.length;
    dietary = (avgFit + 1) / 2; // map [-1,1] → [0,1]
    if (avgFit <= -0.5) {
      happy = false;
      reason = `may not fit ${label}'s dietary needs`;
    } else if (avgFit >= 0.6) {
      reason = `fits ${label}'s dietary needs`;
    }
  }

  // Dining style, spice, mood, rating
  const dining = diningStyleFit(m.diningStyle, bag);

  const restaurantSpicy = hasAny(bag, SPICY_CUISINES);
  let spice = 0.5;
  if (restaurantSpicy && m.spiceLevel >= 60) spice = 1;
  else if (restaurantSpicy && m.spiceLevel <= 30) spice = 0.15;

  const mood = moodFit(r, m.mood);
  const rating = Math.max(0, Math.min(1, r.rating / 5));

  // Weighted base
  let score =
    WEIGHTS.budget * budget +
    WEIGHTS.distance * distance +
    WEIGHTS.cravings * cravings +
    WEIGHTS.dietary * dietary +
    WEIGHTS.dining * dining +
    WEIGHTS.spice * spice +
    WEIGHTS.mood * mood +
    WEIGHTS.rating * rating;

  // Hard penalties (can push a place well down the list)
  const avoided = m.dislikedFoods.some(
    (a) => r.cuisine.toLowerCase() === a.toLowerCase() || bag.includes(a.toLowerCase())
  );
  if (avoided) {
    score -= 0.6;
    happy = false;
    reason = `includes something ${label} wanted to avoid`;
  }

  if (r.openNow === false) {
    score -= 0.4;
    happy = false;
    reason = `is currently closed`;
  }

  return { score: Math.max(0, Math.min(1, score)), reason, happy };
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeGroupMatch(pool: Restaurant[], members: GroupMemberPreferences[]): GroupMatchBreakdown[] {
  if (members.length === 0 || pool.length === 0) return [];

  const results: GroupMatchBreakdown[] = pool.map((restaurant) => {
    const reasons: GroupMatchBreakdown["reasons"] = [];
    const memberScores: number[] = [];

    for (const m of members) {
      const { score, reason, happy } = scoreForMember(restaurant, m);
      memberScores.push(score);
      reasons.push({ member: memberLabel(m), reason, happy });
    }

    // Fair aggregation: reward high average, penalize disagreement so an option
    // that's decent for everyone beats one loved by one and hated by another.
    const avg = memberScores.reduce((a, b) => a + b, 0) / memberScores.length;
    const fairness = stdDev(memberScores) * 0.35;
    const final = Math.max(0, avg - fairness);

    const score = Math.max(5, Math.min(99, Math.round(final * 100)));
    return { restaurant, score, reasons };
  });

  results.sort((a, b) => b.score - a.score);

  if (results.length > 0) results[0].badge = "Best Overall";
  const cheapest = [...results].sort((a, b) => estimateAveragePrice(a.restaurant) - estimateAveragePrice(b.restaurant))[0];
  if (cheapest && cheapest !== results[0]) cheapest.badge = "Cheapest Good Option";
  const closest = [...results].sort((a, b) => (a.restaurant.distanceMiles ?? 99) - (b.restaurant.distanceMiles ?? 99))[0];
  if (closest && !closest.badge) closest.badge = "Closest Good Option";
  const gem = results.find((r) => r.restaurant.isHiddenGem && !r.badge);
  if (gem) gem.badge = "Hidden Gem";
  const safest = results.find((r) => r.reasons.every((x) => x.happy) && !r.badge);
  if (safest) safest.badge = "Safest Pick";

  return results.slice(0, 6);
}
