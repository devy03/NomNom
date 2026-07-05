import type { FoodPreferences } from "@/types";

export interface GeneratedInsight {
  text: string;
  icon: string;
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function getSpiceDescription(level: number): string {
  if (level >= 75) return "spicy";
  if (level >= 50) return "medium heat";
  if (level >= 25) return "mild";
  return "non-spicy";
}

function getDietaryDescription(restrictions: string[]): string {
  if (restrictions.length === 0) return null;
  if (restrictions.includes("vegetarian")) return "Vegetarian-friendly";
  if (restrictions.includes("vegan")) return "Vegan options";
  if (restrictions.includes("gluten-free")) return "Gluten-free";
  return restrictions[0];
}

export function generateInsights(prefs: FoodPreferences | null, isNew: boolean): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];
  const timeOfDay = getTimeOfDay();

  if (!prefs || isNew) {
    // Onboarding insights for new users
    insights.push({ text: "NomNom is learning your taste 🧠", icon: "✨" });
    insights.push({ text: "Tell us your favorites to get smarter recommendations", icon: "🎯" });
    if (timeOfDay === "night") {
      insights.push({ text: "Late night cravings detected 🌙", icon: "🍕" });
    } else if (timeOfDay === "morning") {
      insights.push({ text: "Good morning! Ready to find brunch? 🥐", icon: "☀️" });
    }
    insights.push({ text: "Join a group chat to decide with friends 👥", icon: "💬" });
    return insights;
  }

  // Generate insights from user preferences
  if (prefs.favoriteCuisines.length > 0) {
    const cuisines = prefs.favoriteCuisines.slice(0, 2).join(" and ");
    insights.push({ text: `You love ${cuisines} 😋`, icon: "❤️" });
  }

  if (prefs.spiceLevel > 0) {
    const spiceDesc = getSpiceDescription(prefs.spiceLevel);
    insights.push({ text: `You usually go for ${spiceDesc} food 🌶️`, icon: "🔥" });
  }

  if (prefs.budgetMax > 0) {
    insights.push({
      text: `Your budget is usually under $${prefs.budgetMax}`,
      icon: "💰",
    });
  }

  if (prefs.maxDistanceMiles > 0) {
    insights.push({
      text: `You prefer places within ${prefs.maxDistanceMiles} miles`,
      icon: "📍",
    });
  }

  if (prefs.dietaryRestrictions.length > 0) {
    const dietaryDesc = getDietaryDescription(prefs.dietaryRestrictions);
    if (dietaryDesc) {
      insights.push({ text: `${dietaryDesc} picks will be prioritized`, icon: "🥗" });
    }
  }

  if (prefs.dislikedFoods.length > 0) {
    insights.push({
      text: `We're skipping ${prefs.dislikedFoods[0]}... no judgment 😉`,
      icon: "👍",
    });
  }

  // Time-based insights
  if (timeOfDay === "night") {
    insights.push({ text: "Late night cravings detected? Let's find something 🌙", icon: "🍜" });
  } else if (timeOfDay === "morning") {
    insights.push({ text: "Good morning! Let's find your breakfast ☀️", icon: "🥐" });
  } else if (prefs.diningStyle === "takeout" || prefs.diningStyle === "delivery") {
    insights.push({
      text: `${prefs.diningStyle === "delivery" ? "Delivery" : "Takeout"} ready 🏃`,
      icon: "⚡",
    });
  }

  // Generic fallback insights
  if (insights.length === 0) {
    insights.push({ text: "Ready to discover your next favorite? 🎯", icon: "✨" });
    insights.push({ text: "Browse by mood, location, or cuisine 🗺️", icon: "🧭" });
  }

  // Ensure we have at least 3 insights for good marquee effect
  while (insights.length < 3) {
    if (!insights.some((i) => i.text.includes("friends"))) {
      insights.push({ text: "Invite friends to decide together 👥", icon: "💬" });
    } else if (!insights.some((i) => i.text.includes("mood"))) {
      insights.push({ text: "Pick a mood to narrow down options 🎭", icon: "😊" });
    } else {
      insights.push({ text: "Your preferences are helping us find better matches 🎯", icon: "🔍" });
    }
  }

  return insights;
}

export const defaultInsights: GeneratedInsight[] = [
  { text: "Welcome to NomNom 👋", icon: "✨" },
  { text: "Tell us your preferences to get smarter recommendations 🎯", icon: "🧠" },
  { text: "Browse by cuisine, mood, or nearby restaurants 🗺️", icon: "🧭" },
];
