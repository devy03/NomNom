import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChefHat, Clock, Flame, Camera, UtensilsCrossed } from "lucide-react";
import { commonIngredients, pantryRecipes } from "@/data/mockData";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/StateViews";

const difficultyTone: Record<string, "success" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

export function CookPage() {
  const [pantry, setPantry] = useState<string[]>(["Chicken", "Garlic", "Rice"]);
  const [customInput, setCustomInput] = useState("");

  const toggleIngredient = (ing: string) => {
    setPantry((p) => (p.includes(ing) ? p.filter((i) => i !== ing) : [...p, ing]));
  };

  const addCustom = () => {
    const val = customInput.trim();
    if (val && !pantry.includes(val)) setPantry((p) => [...p, val]);
    setCustomInput("");
  };

  const matches = useMemo(() => {
    return pantryRecipes
      .map((recipe) => {
        const have = recipe.usesIngredients.filter((i) => pantry.includes(i)).length;
        return { recipe, matchPct: Math.round((have / recipe.usesIngredients.length) * 100) };
      })
      .filter((m) => m.matchPct > 0)
      .sort((a, b) => b.matchPct - a.matchPct);
  }, [pantry]);

  return (
    <div className="mx-auto max-w-5xl px-6">
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-zinc-300">
          <ChefHat size={13} className="text-amber-400" /> Cook With What I Have
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">What's in your kitchen?</h1>
        <p className="mt-2 text-sm text-zinc-400">Add ingredients and I'll find recipes that work.</p>
      </div>

      <div className="glass mx-auto mt-8 max-w-2xl rounded-3xl p-5">
        <div className="flex items-center gap-2">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Add an ingredient..."
            className="flex-1"
          />
          <Button size="sm" variant="glass" onClick={addCustom}>
            <Plus size={14} /> Add
          </Button>
          <Button size="sm" variant="outline">
            <Camera size={14} /> Scan Fridge
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <AnimatePresence>
            {pantry.map((ing) => (
              <motion.button
                key={ing}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => toggleIngredient(ing)}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 ring-1 ring-amber-500/30"
              >
                {ing} <X size={12} />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        <p className="mt-4 mb-2 text-xs font-medium text-zinc-500">Quick add</p>
        <div className="flex flex-wrap gap-2">
          {commonIngredients.map((ing) => {
            const active = pantry.includes(ing);
            return (
              <button
                key={ing}
                onClick={() => toggleIngredient(ing)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-violet-400/60 ${
                  active ? "bg-white/15 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                }`}
              >
                {ing}
              </button>
            );
          })}
        </div>
      </div>

      {matches.length > 0 && (
        <h2 className="mt-10 mb-4 text-lg font-semibold text-white">{matches.length} recipes you can make</h2>
      )}

      {matches.length === 0 && (
        <div className="mt-10">
          <EmptyState
            icon={UtensilsCrossed}
            title="Add ingredients to see recipes"
            description="Try adding a protein, a starch, and something fresh — that's usually enough to find a match."
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map(({ recipe, matchPct }, i) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -6 }}
            className="glass overflow-hidden rounded-3xl"
          >
            <div className="relative h-36">
              <img src={recipe.image} alt={recipe.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute right-3 top-3">
                <Badge tone={matchPct === 100 ? "success" : "warning"}>{matchPct}% match</Badge>
              </div>
              <h3 className="absolute bottom-3 left-4 right-4 text-base font-semibold text-white">{recipe.title}</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <Badge tone={difficultyTone[recipe.difficulty]}>{recipe.difficulty}</Badge>
                <span className="flex items-center gap-1"><Clock size={12} /> {recipe.timeMins} min</span>
                <span className="flex items-center gap-1"><Flame size={12} /> {recipe.calories} cal</span>
              </div>
              {recipe.missingIngredients.length > 0 && (
                <p className="mt-3 text-xs text-zinc-500">
                  Missing: <span className="text-zinc-300">{recipe.missingIngredients.join(", ")}</span>
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
