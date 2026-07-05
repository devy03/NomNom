const img = (seed: string) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=80`;

export interface Mood {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  description: string;
}

export const moods: Mood[] = [
  { id: "happy", label: "Happy", emoji: "😊", gradient: "from-amber-400 to-orange-500", description: "Something fun and shareable" },
  { id: "stressed", label: "Stressed", emoji: "😩", gradient: "from-violet-500 to-indigo-600", description: "Comfort food to unwind" },
  { id: "tired", label: "Tired", emoji: "🥱", gradient: "from-slate-500 to-slate-700", description: "Low effort, high satisfaction" },
  { id: "celebrating", label: "Celebrating", emoji: "🥳", gradient: "from-fuchsia-500 to-pink-600", description: "Something worth the moment" },
  { id: "sick", label: "Sick", emoji: "🤒", gradient: "from-emerald-500 to-teal-600", description: "Warm, gentle, and healing" },
  { id: "date", label: "Date Night", emoji: "❤️", gradient: "from-rose-500 to-red-600", description: "Romantic and memorable" },
  { id: "home", label: "Staying Home", emoji: "🏠", gradient: "from-cyan-500 to-blue-600", description: "Delivery worth waiting for" },
];

export interface DashboardCard {
  id: string;
  title: string;
  emoji: string;
  gradient: string;
  path: string;
  subtitle: string;
}

export const dashboardCards: DashboardCard[] = [
  { id: "cravings", title: "Cravings", emoji: "🍕", gradient: "from-orange-500/30 to-red-500/20", path: "/chat", subtitle: "What sounds good right now" },
  { id: "favorites", title: "Favorites", emoji: "❤️", gradient: "from-pink-500/30 to-rose-500/20", path: "/favorites", subtitle: "Your saved places" },
  { id: "group", title: "Group Decision", emoji: "👥", gradient: "from-violet-500/30 to-purple-500/20", path: "/group", subtitle: "Let everyone vote" },
  { id: "roulette", title: "Food Roulette", emoji: "🎲", gradient: "from-fuchsia-500/30 to-pink-500/20", path: "/roulette", subtitle: "Spin for a surprise" },
  { id: "cook", title: "Cook With What I Have", emoji: "🍳", gradient: "from-amber-500/30 to-yellow-500/20", path: "/cook", subtitle: "Use your pantry" },
  { id: "nearby", title: "Nearby", emoji: "📍", gradient: "from-cyan-500/30 to-sky-500/20", path: "/nearby", subtitle: "Close to you right now" },
  { id: "gems", title: "Hidden Gems", emoji: "⭐", gradient: "from-yellow-500/30 to-amber-600/20", path: "/nearby?f=gems", subtitle: "Local favorites" },
  { id: "healthy", title: "Healthy", emoji: "🥗", gradient: "from-emerald-500/30 to-green-500/20", path: "/nearby?f=healthy", subtitle: "Light and fresh" },
  { id: "dessert", title: "Dessert", emoji: "🍦", gradient: "from-rose-400/30 to-pink-400/20", path: "/nearby?f=dessert", subtitle: "Treat yourself" },
];

export const memoryInsights = [
  "You had sushi yesterday — maybe switch it up tonight?",
  "You usually order spicy food on Fridays 🌶️",
  "You typically spend under $18 per meal",
  "You haven't tried Italian in 3 weeks",
  "Your longest streak: Mexican Mondays, 6 weeks running",
];

export interface Achievement {
  id: string;
  title: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  progress: number;
}

export const achievements: Achievement[] = [
  { id: "explorer", title: "Food Explorer", emoji: "🧭", description: "Try 10 different cuisines", unlocked: true, progress: 100 },
  { id: "pizza", title: "Pizza Master", emoji: "🍕", description: "Order pizza 20 times", unlocked: true, progress: 100 },
  { id: "coffee", title: "Coffee Hunter", emoji: "☕", description: "Visit 15 coffee shops", unlocked: false, progress: 60 },
  { id: "street", title: "Street Food King", emoji: "👑", description: "Try 8 street food spots", unlocked: false, progress: 37 },
  { id: "sushi", title: "Sushi Lover", emoji: "🍣", description: "Order sushi 12 times", unlocked: true, progress: 100 },
  { id: "spice", title: "Heat Seeker", emoji: "🌶️", description: "Try 5 extra spicy dishes", unlocked: false, progress: 80 },
];

export interface PantryRecipe {
  id: string;
  title: string;
  image: string;
  usesIngredients: string[];
  missingIngredients: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  timeMins: number;
  calories: number;
}

export const commonIngredients = [
  "Chicken", "Rice", "Eggs", "Garlic", "Onion", "Tomato", "Cheese", "Pasta",
  "Broccoli", "Bell Pepper", "Ground Beef", "Tofu", "Spinach", "Potato",
  "Bacon", "Shrimp", "Butter", "Milk", "Lemon", "Basil",
];

export const pantryRecipes: PantryRecipe[] = [
  { id: "p1", title: "Garlic Butter Chicken & Rice", image: img("photo-1598103442097-8b74394b95c6"), usesIngredients: ["Chicken", "Rice", "Garlic", "Butter"], missingIngredients: [], difficulty: "Easy", timeMins: 25, calories: 520 },
  { id: "p2", title: "Creamy Tomato Pasta", image: img("photo-1621996346565-e3dbc646d9a9"), usesIngredients: ["Pasta", "Tomato", "Garlic", "Cheese"], missingIngredients: ["Cream"], difficulty: "Easy", timeMins: 20, calories: 610 },
  { id: "p3", title: "Loaded Veggie Fried Rice", image: img("photo-1603133872878-684f208fb84b"), usesIngredients: ["Rice", "Eggs", "Onion", "Bell Pepper"], missingIngredients: ["Soy Sauce"], difficulty: "Easy", timeMins: 18, calories: 430 },
  { id: "p4", title: "Spinach & Tofu Stir Fry", image: img("photo-1512058564366-18510be2db19"), usesIngredients: ["Tofu", "Spinach", "Garlic"], missingIngredients: ["Sesame Oil"], difficulty: "Medium", timeMins: 22, calories: 380 },
  { id: "p5", title: "Bacon Potato Hash", image: img("photo-1568051243858-533a607809a5"), usesIngredients: ["Bacon", "Potato", "Onion", "Eggs"], missingIngredients: [], difficulty: "Easy", timeMins: 30, calories: 560 },
  { id: "p6", title: "Lemon Garlic Shrimp", image: img("photo-1565680018434-b513d5e5fd47"), usesIngredients: ["Shrimp", "Garlic", "Lemon", "Butter"], missingIngredients: [], difficulty: "Medium", timeMins: 15, calories: 340 },
];

export const userProfile = {
  name: "Alex",
  mostEaten: { label: "Pizza", emoji: "🍕" },
  favoriteCuisine: { label: "Indian", emoji: "🇮🇳" },
  avgSpend: 21,
  longestStreak: "Mexican Mondays",
  spiceTolerance: 72,
  cuisineBreakdown: [
    { cuisine: "Italian", pct: 22 },
    { cuisine: "Indian", pct: 19 },
    { cuisine: "Japanese", pct: 17 },
    { cuisine: "Mexican", pct: 15 },
    { cuisine: "American", pct: 14 },
    { cuisine: "Thai", pct: 13 },
  ],
  weeklyMeals: [3, 5, 2, 6, 4, 7, 5],
};
