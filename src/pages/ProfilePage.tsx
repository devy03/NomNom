import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Heart } from "lucide-react";
import { achievements, userProfile } from "@/data/mockData";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/shared/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { getFoodPreferences, getProfile } from "@/services/profileService";
import type { FoodPreferences, Profile } from "@/types";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<FoodPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, fp] = await Promise.all([getProfile(user?.id), getFoodPreferences(user?.id)]);
      if (!cancelled) {
        setProfile(p);
        setPrefs(fp);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading) return <LoadingState message="Loading your food personality..." />;

  const maxMeals = Math.max(...userProfile.weeklyMeals);
  const displayName = profile?.displayName ?? "Food Explorer";
  const favoriteCuisines = prefs?.favoriteCuisines?.length ? prefs.favoriteCuisines : ["Indian", "Italian", "Japanese"];
  const spiceLevel = prefs?.spiceLevel ?? userProfile.spiceTolerance;
  const budgetLabel = prefs ? `$${prefs.budgetMin}–$${prefs.budgetMax}` : `$${userProfile.avgSpend}`;

  return (
    <div className="mx-auto max-w-4xl px-6">
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-3xl font-bold text-white shadow-xl shadow-fuchsia-500/30"
        >
          {displayName[0]?.toUpperCase()}
        </motion.div>
        <h1 className="mt-4 text-2xl font-semibold text-white">{displayName}</h1>
        <p className="text-sm text-zinc-400">Your AI Food Personality</p>
        <div className="mt-4 flex gap-2">
          <Link to="/settings">
            <Button size="sm" variant="glass">
              <Settings size={14} /> Edit Preferences
            </Button>
          </Link>
          <Link to="/favorites">
            <Button size="sm" variant="outline">
              <Heart size={14} /> Saved Places
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Most Eaten", value: `${userProfile.mostEaten.emoji} ${userProfile.mostEaten.label}` },
          { label: "Favorite Cuisine", value: favoriteCuisines[0] },
          { label: "Budget Range", value: budgetLabel },
          { label: "Longest Streak", value: userProfile.longestStreak },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass rounded-2xl p-4 text-center"
          >
            <div className="text-base font-semibold text-white">{s.value}</div>
            <div className="mt-1 text-[11px] text-zinc-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {prefs && (prefs.dietaryRestrictions.length > 0 || prefs.allergies.length > 0) && (
        <div className="glass mt-6 flex flex-wrap gap-4 rounded-3xl p-5">
          {prefs.dietaryRestrictions.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-zinc-500">Dietary Restrictions</p>
              <div className="flex flex-wrap gap-1.5">
                {prefs.dietaryRestrictions.map((d) => <Badge key={d}>{d}</Badge>)}
              </div>
            </div>
          )}
          {prefs.allergies.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-zinc-500">Allergies</p>
              <div className="flex flex-wrap gap-1.5">
                {prefs.allergies.map((d) => <Badge key={d} tone="danger">{d}</Badge>)}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="glass mt-6 rounded-3xl p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Spice Tolerance</h3>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${spiceLevel}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600"
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">You can handle {spiceLevel}% of the heat scale 🌶️</p>
      </div>

      <div className="glass mt-6 rounded-3xl p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Cuisine Breakdown</h3>
        <div className="space-y-3">
          {userProfile.cuisineBreakdown.map((c, i) => (
            <div key={c.cuisine}>
              <div className="mb-1 flex justify-between text-xs text-zinc-400">
                <span>{c.cuisine}</span>
                <span>{c.pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass mt-6 rounded-3xl p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">This Week</h3>
        <div className="flex items-end justify-between gap-2 h-28">
          {userProfile.weeklyMeals.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(v / maxMeals) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-fuchsia-400"
                style={{ minHeight: 4 }}
              />
              <span className="text-[10px] text-zinc-500">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <h3 className="mt-10 mb-4 text-lg font-semibold text-white">Achievements</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 18 }}
            whileHover={{ y: -4 }}
            className={`glass relative overflow-hidden rounded-3xl p-5 text-center ${!a.unlocked && "opacity-60 grayscale"}`}
          >
            {a.unlocked && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-fuchsia-400/10"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            )}
            <div className="relative text-3xl">{a.emoji}</div>
            <div className="relative mt-2 text-sm font-semibold text-white">{a.title}</div>
            <p className="relative mt-1 text-[11px] text-zinc-500">{a.description}</p>
            <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500"
                style={{ width: `${a.progress}%` }}
              />
            </div>
            {a.unlocked && (
              <div className="relative mt-2">
                <Badge tone="success">Unlocked</Badge>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
