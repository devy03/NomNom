import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ChipSelect } from "@/components/ui/ChipSelect";
import { LoadingState } from "@/components/shared/StateViews";
import {
  CUISINE_OPTIONS,
  DISLIKED_FOOD_OPTIONS,
  DIETARY_RESTRICTION_OPTIONS,
  ALLERGY_OPTIONS,
  RECOMMENDATION_STYLE_OPTIONS,
  DINING_STYLE_OPTIONS,
} from "@/data/preferenceOptions";
import { defaultPreferences, getFoodPreferences, getProfile, saveFoodPreferences, upsertProfile } from "@/services/profileService";
import { signOut } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import type { DiningStyle, FoodPreferences, RecommendationStyle } from "@/types";
import { useNavigate } from "react-router-dom";

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function SettingsPage() {
  const { user, isConfigured } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [prefs, setPrefs] = useState<FoodPreferences>(defaultPreferences);

  useEffect(() => {
    (async () => {
      const [p, fp] = await Promise.all([getProfile(user?.id), getFoodPreferences(user?.id)]);
      setDisplayName(p?.displayName ?? "");
      setPrefs(fp);
      setLoading(false);
    })();
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertProfile(user?.id, { displayName });
      await saveFoodPreferences(user?.id, prefs);
      toast("Preferences updated.", "success");
    } catch {
      toast("Couldn't save changes. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast("Logged out.", "info");
      navigate("/login");
    } catch {
      toast("Couldn't log out.", "error");
    }
  };

  if (loading) return <LoadingState message="Loading your settings..." />;

  return (
    <div className="mx-auto max-w-2xl px-6 pb-16">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
      <p className="mt-1 text-sm text-zinc-400">Update your name and food preferences any time.</p>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass mt-6 space-y-6 rounded-3xl p-6">
        <div>
          <Label>Display Name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Alex" />
        </div>

        <div>
          <Label>Favorite Cuisines</Label>
          <ChipSelect
            options={CUISINE_OPTIONS}
            selected={prefs.favoriteCuisines}
            onToggle={(v) => setPrefs((p) => ({ ...p, favoriteCuisines: toggle(p.favoriteCuisines, v) }))}
          />
        </div>

        <div>
          <Label>Foods to Avoid</Label>
          <ChipSelect
            options={DISLIKED_FOOD_OPTIONS}
            selected={prefs.dislikedFoods}
            onToggle={(v) => setPrefs((p) => ({ ...p, dislikedFoods: toggle(p.dislikedFoods, v) }))}
          />
        </div>

        <div>
          <Label>Dietary Restrictions</Label>
          <ChipSelect
            options={DIETARY_RESTRICTION_OPTIONS}
            selected={prefs.dietaryRestrictions}
            onToggle={(v) => setPrefs((p) => ({ ...p, dietaryRestrictions: toggle(p.dietaryRestrictions, v) }))}
          />
        </div>

        <div>
          <Label>Allergies</Label>
          <ChipSelect
            options={ALLERGY_OPTIONS}
            selected={prefs.allergies}
            onToggle={(v) => setPrefs((p) => ({ ...p, allergies: toggle(p.allergies, v) }))}
          />
        </div>

        <div>
          <Label>Budget per meal: ${prefs.budgetMin} – ${prefs.budgetMax}</Label>
          <div className="flex items-center gap-3">
            <input type="range" min={5} max={100} value={prefs.budgetMin}
              onChange={(e) => setPrefs((p) => ({ ...p, budgetMin: Math.min(Number(e.target.value), p.budgetMax) }))}
              className="w-full accent-violet-500" />
            <input type="range" min={5} max={150} value={prefs.budgetMax}
              onChange={(e) => setPrefs((p) => ({ ...p, budgetMax: Math.max(Number(e.target.value), p.budgetMin) }))}
              className="w-full accent-fuchsia-500" />
          </div>
        </div>

        <div>
          <Label>Spice Tolerance: {prefs.spiceLevel}%</Label>
          <input type="range" min={0} max={100} value={prefs.spiceLevel}
            onChange={(e) => setPrefs((p) => ({ ...p, spiceLevel: Number(e.target.value) }))}
            className="w-full accent-orange-500" />
        </div>

        <div>
          <Label>Max Travel Distance: {prefs.maxDistanceMiles} mi</Label>
          <input type="range" min={1} max={25} value={prefs.maxDistanceMiles}
            onChange={(e) => setPrefs((p) => ({ ...p, maxDistanceMiles: Number(e.target.value) }))}
            className="w-full accent-cyan-500" />
        </div>

        <div>
          <Label>Dining Style</Label>
          <ChipSelect
            options={DINING_STYLE_OPTIONS.map((o) => o.label)}
            selected={[DINING_STYLE_OPTIONS.find((o) => o.id === prefs.diningStyle)?.label ?? ""]}
            onToggle={(label) => {
              const opt = DINING_STYLE_OPTIONS.find((o) => o.label === label);
              if (opt) setPrefs((p) => ({ ...p, diningStyle: opt.id as DiningStyle }));
            }}
          />
        </div>

        <div>
          <Label>Recommendation Style</Label>
          <ChipSelect
            options={RECOMMENDATION_STYLE_OPTIONS.map((o) => o.label)}
            selected={prefs.recommendationStyles.map((id) => RECOMMENDATION_STYLE_OPTIONS.find((o) => o.id === id)?.label ?? id)}
            onToggle={(label) => {
              const opt = RECOMMENDATION_STYLE_OPTIONS.find((o) => o.label === label);
              if (!opt) return;
              setPrefs((p) => ({ ...p, recommendationStyles: toggle(p.recommendationStyles, opt.id as RecommendationStyle) }));
            }}
          />
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={14} /> Log Out
          </Button>
          <Button size="md" onClick={handleSave} disabled={saving}>
            <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {!isConfigured && (
          <p className="text-center text-xs text-amber-300/80">
            Demo mode: changes are saved locally in your browser only.
          </p>
        )}
      </motion.div>
    </div>
  );
}
