export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string; // Google place_id, or "mock-*" id when using fallback data
  source: "google" | "mock";
  name: string;
  image: string;
  photos: string[];
  rating: number;
  reviewsCount: number;
  distanceMiles?: number;
  driveTimeMins?: number;
  priceLevel: 1 | 2 | 3 | 4;
  cuisine: string;
  openNow: boolean | "unknown";
  address: string;
  location: Coordinates;
  phone?: string;
  website?: string;
  mapsUrl: string;
  hours?: string[];
  tags: string[];
  isHiddenGem?: boolean;
  isNew?: boolean;
  waitTimeMins?: number;
  matchReason?: string;
}

export type DiningStyle = "dine-in" | "takeout" | "delivery" | "cook-at-home";
export type RecommendationStyle = "healthy" | "cheap" | "quick" | "fancy" | "hidden-gem";

export interface FoodPreferences {
  id?: string;
  userId?: string;
  favoriteCuisines: string[];
  dislikedFoods: string[];
  dietaryRestrictions: string[];
  allergies: string[];
  spiceLevel: number; // 0-100
  budgetMin: number;
  budgetMax: number;
  maxDistanceMiles: number;
  diningStyle: DiningStyle;
  recommendationStyles: RecommendationStyle[];
  moodPreferences?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Profile {
  id?: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FavoriteRestaurant {
  id: string;
  userId: string;
  placeId: string;
  restaurantName: string;
  address: string;
  rating: number;
  photoUrl: string;
  createdAt: string;
}

export interface RestaurantHistoryEntry {
  id: string;
  userId: string;
  placeId: string;
  restaurantName: string;
  visitedAt: string;
  notes?: string;
}

export type RoomStatus = "waiting" | "active" | "completed" | "expired";

export interface GroupRoom {
  id: string;
  roomCode: string;
  createdBy: string;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  roomId: string;
  userId?: string;
  guestName: string;
  isReady: boolean;
  joinedAt: string;
}

export interface GroupMemberPreferences {
  id?: string;
  roomId: string;
  userId?: string;
  guestName: string;
  budgetMin: number;
  budgetMax: number;
  maxDistanceMiles: number;
  cravings: string[];
  dislikedFoods: string[];
  dietaryRestrictions: string[];
  mood: string;
  diningStyle: DiningStyle;
  spiceLevel: number;
  openToNewPlaces: boolean;
  isReady: boolean;
  updatedAt?: string;
}

export interface GroupResult {
  id?: string;
  roomId: string;
  placeId: string;
  restaurantName: string;
  compatibilityScore: number;
  reasonSummary: string;
  createdAt?: string;
}

export interface GroupMatchBreakdown {
  restaurant: Restaurant;
  score: number;
  reasons: { member: string; reason: string; happy: boolean }[];
  badge?: "Best Overall" | "Cheapest Good Option" | "Closest Good Option" | "Hidden Gem" | "Safest Pick";
}
