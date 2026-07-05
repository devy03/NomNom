import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { AIOrb } from "@/components/shared/AIOrb";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ChipSelect } from "@/components/ui/ChipSelect";
import {
  CUISINE_OPTIONS,
  DISLIKED_FOOD_OPTIONS,
  DIETARY_RESTRICTION_OPTIONS,
  ALLERGY_OPTIONS,
  RECOMMENDATION_STYLE_OPTIONS,
  DINING_STYLE_OPTIONS,
} from "@/data/preferenceOptions";
import { defaultPreferences, saveFoodPreferences, upsertProfile } from "@/services/profileService";
import type { DiningStyle, FoodPreferences, RecommendationStyle } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

const STEPS = ["Name", "Cuisines", "Dislikes", "Dietary", "Budget & Spice", "Style"] as const;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [prefs, setPrefs] = useState<FoodPreferences>(defaultPreferences);

  const isLast = step === STEPS.length - 1;

  const next = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setSaving(true);
    try {
      await upsertProfile(user?.id, { displayName: displayName || "Food Explorer" });
      await saveFoodPreferences(user?.id, prefs);
      toast("Preferences saved. Let's find something good to eat.", "success");
      navigate("/home");
    } catch {
      toast("Couldn't save preferences, but you can still explore.", "error");
      navigate("/home");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16">
      <AIOrb size={100} className="mb-6" />

      <div className="mb-8 flex w-full items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`h-1.5 w-full rounded-full transition-colors ${
                i <= step ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-white/10"
              }`}
            />
          </div>
        ))}
      </div>

      <div className="glass-strong w-full rounded-3xl p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white">What should we call you?</h2>
                <p className="mt-1 mb-5 text-sm text-zinc-400">This is how you'll appear in group rooms.</p>
                <Label>Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Alex" autoFocus />
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-white">Favorite cuisines?</h2>
                <p className="mt-1 mb-5 text-sm text-zinc-400">Pick as many as you like.</p>
                <ChipSelect
                  options={CUISINE_OPTIONS}
                  selected={prefs.favoriteCuisines}
                  onToggle={(v) => setPrefs((p) => ({ ...p, favoriteCuisines: toggle(p.favoriteCuisines, v) }))}
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-white">Anything you'd rather avoid?</h2>
                <p className="mt-1 mb-5 text-sm text-zinc-400">We'll steer recommendations away from these.</p>
                <ChipSelect
                  options={DISLIKED_FOOD_OPTIONS}
                  selected={prefs.dislikedFoods}
                  onToggle={(v) => setPrefs((p) => ({ ...p, dislikedFoods: toggle(p.dislikedFoods, v) }))}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Dietary restrictions & allergies</h2>
                  <p className="mt-1 mb-4 text-sm text-zinc-400">We'll only suggest places that work for you.</p>
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
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Budget & spice tolerance</h2>
                <div>
                  <Label>Budget per meal: ${prefs.budgetMin} – ${prefs.budgetMax}</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min={5} max={100} value={prefs.budgetMin}
                      onChange={(e) => setPrefs((p) => ({ ...p, budgetMin: Math.min(Number(e.target.value), p.budgetMax) }))}
                      className="w-full accent-violet-500"
                    />
                    <input
                      type="range" min={5} max={150} value={prefs.budgetMax}
                      onChange={(e) => setPrefs((p) => ({ ...p, budgetMax: Math.max(Number(e.target.value), p.budgetMin) }))}
                      className="w-full accent-fuchsia-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Spice tolerance: {prefs.spiceLevel}%</Label>
                  <input
                    type="range" min={0} max={100} value={prefs.spiceLevel}
                    onChange={(e) => setPrefs((p) => ({ ...p, spiceLevel: Number(e.target.value) }))}
                    className="w-full accent-orange-500"
                  />
                </div>
                <div>
                  <Label>Max travel distance: {prefs.maxDistanceMiles} mi</Label>
                  <input
                    type="range" min={1} max={25} value={prefs.maxDistanceMiles}
                    onChange={(e) => setPrefs((p) => ({ ...p, maxDistanceMiles: Number(e.target.value) }))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">How do you like to eat?</h2>
                  <p className="mt-1 mb-4 text-sm text-zinc-400">Pick your usual style.</p>
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
                  <Label>What kind of recommendations do you want?</Label>
                  <ChipSelect
                    options={RECOMMENDATION_STYLE_OPTIONS.map((o) => o.label)}
                    selected={prefs.recommendationStyles.map(
                      (id) => RECOMMENDATION_STYLE_OPTIONS.find((o) => o.id === id)?.label ?? id
                    )}
                    onToggle={(label) => {
                      const opt = RECOMMENDATION_STYLE_OPTIONS.find((o) => o.label === label);
                      if (!opt) return;
                      setPrefs((p) => ({
                        ...p,
                        recommendationStyles: toggle(p.recommendationStyles, opt.id as RecommendationStyle),
                      }));
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft size={14} /> Back
          </Button>
          <Button size="md" onClick={next} disabled={saving}>
            {isLast ? (
              <>
                <Check size={16} /> {saving ? "Saving..." : "Finish"}
              </>
            ) : (
              <>
                Next <ArrowRight size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
