export const CUISINE_OPTIONS = [
  "Italian", "Japanese", "Mexican", "Indian", "Thai", "American",
  "Korean", "Mediterranean", "Vietnamese", "French", "Chinese", "Dessert",
];

export const DISLIKED_FOOD_OPTIONS = [
  "Seafood", "Spicy", "Mushrooms", "Cilantro", "Red Meat", "Dairy", "Olives", "Blue Cheese",
];

export const DIETARY_RESTRICTION_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Keto", "Dairy-Free", "Nut-Free",
];

export const ALLERGY_OPTIONS = [
  "Peanuts", "Tree Nuts", "Shellfish", "Dairy", "Eggs", "Soy", "Gluten", "Sesame",
];

export const RESTAURANT_TYPE_OPTIONS = [
  "Fast Casual", "Fine Dining", "Food Truck", "Cafe", "Buffet", "Bakery", "Bar & Grill", "Pop-up",
];

export const RECOMMENDATION_STYLE_OPTIONS = [
  { id: "healthy", label: "Healthy" },
  { id: "cheap", label: "Cheap" },
  { id: "quick", label: "Quick" },
  { id: "fancy", label: "Fancy" },
  { id: "hidden-gem", label: "Hidden Gem" },
] as const;

export const DINING_STYLE_OPTIONS = [
  { id: "dine-in", label: "Dine-in" },
  { id: "takeout", label: "Takeout" },
  { id: "delivery", label: "Delivery" },
  { id: "cook-at-home", label: "Cook at Home" },
] as const;

export const MOOD_OPTIONS = ["Happy", "Stressed", "Tired", "Celebrating", "Sick", "Date Night", "Staying Home"];
