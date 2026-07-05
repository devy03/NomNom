import type { GroupMatchBreakdown, GroupMemberPreferences, Restaurant } from "@/types";
import { estimateAveragePrice } from "@/services/restaurantService";

function memberLabel(m: GroupMemberPreferences) {
  return m.guestName || "A member";
}

function scoreForMember(r: Restaurant, m: GroupMemberPreferences) {
  let points = 0;
  let reason = `works for ${memberLabel(m)}`;
  let happy = true;
  const avgPrice = estimateAveragePrice(r);

  if (avgPrice <= m.budgetMax) {
    points += 1;
    reason = `stays under ${memberLabel(m)}'s $${m.budgetMax} budget`;
  } else {
    happy = false;
    points -= 1;
    reason = `runs over ${memberLabel(m)}'s $${m.budgetMax} budget`;
  }

  if (m.maxDistanceMiles && r.distanceMiles != null) {
    if (r.distanceMiles <= m.maxDistanceMiles) points += 0.5;
    else {
      points -= 1.5;
      happy = false;
      reason = `is farther than ${memberLabel(m)} wanted to travel`;
    }
  }

  if (m.dietaryRestrictions.includes("Vegetarian") || m.dietaryRestrictions.includes("Vegan")) {
    if (r.tags.some((t) => t.includes("vegetarian"))) {
      points += 1.5;
      reason = `has vegetarian options for ${memberLabel(m)}`;
    } else {
      points -= 2;
      happy = false;
      reason = `may not fit ${memberLabel(m)}'s dietary restrictions`;
    }
  }

  const craved = m.cravings.some(
    (c) => r.name.toLowerCase().includes(c.toLowerCase()) || r.cuisine.toLowerCase() === c.toLowerCase() || r.tags.some((t) => t.includes(c.toLowerCase()))
  );
  if (craved) {
    points += 1.5;
    reason = `matches what ${memberLabel(m)} was craving`;
  }

  const avoided = m.dislikedFoods.some(
    (a) => r.tags.includes(a.toLowerCase()) || r.cuisine.toLowerCase() === a.toLowerCase()
  );
  if (avoided) {
    points -= 2;
    happy = false;
    reason = `includes something ${memberLabel(m)} wanted to avoid`;
  }

  if (r.openNow === true) points += 0.5;
  if (r.openNow === false) {
    points -= 3;
    happy = false;
    reason = `is currently closed`;
  }

  return { points, reason, happy };
}

export function computeGroupMatch(pool: Restaurant[], members: GroupMemberPreferences[]): GroupMatchBreakdown[] {
  if (members.length === 0 || pool.length === 0) return [];

  const results: GroupMatchBreakdown[] = pool.map((restaurant) => {
    let totalPoints = 0;
    const maxPossible = members.length * 3.5;
    const reasons: GroupMatchBreakdown["reasons"] = [];

    for (const m of members) {
      const { points, reason, happy } = scoreForMember(restaurant, m);
      totalPoints += Math.max(-2, points);
      reasons.push({ member: memberLabel(m), reason, happy });
    }

    const score = Math.max(5, Math.min(99, Math.round((totalPoints / maxPossible) * 100)));
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
