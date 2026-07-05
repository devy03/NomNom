import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { moods } from "@/data/mockData";
import { mockRestaurants } from "@/data/mockRestaurants";
import type { Restaurant } from "@/types";
import { RestaurantCard } from "@/components/shared/RestaurantCard";

const moodTagMap: Record<string, string[]> = {
  happy: ["sweet", "Dessert", "American"],
  stressed: ["comfort food", "Chinese"],
  tired: ["budget", "quick", "comfort food"],
  celebrating: ["celebrating", "French", "Italian"],
  sick: ["Vietnamese", "comfort food"],
  date: ["date night", "romantic"],
  home: ["comfort food", "budget"],
};

export function MoodPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const results: Restaurant[] = selected
    ? mockRestaurants.filter((r) =>
        (moodTagMap[selected] ?? []).some((t) => r.tags.includes(t.toLowerCase()) || r.cuisine === t)
      ).slice(0, 4)
    : [];

  return (
    <div className="mx-auto max-w-4xl px-6">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-3xl font-semibold tracking-tight text-white"
      >
        How are you feeling today?
      </motion.h1>
      <p className="mt-2 text-center text-sm text-zinc-400">
        Your mood shapes what actually sounds good right now.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {moods.map((mood, i) => (
          <motion.button
            key={mood.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelected(mood.id)}
            className={`glass relative overflow-hidden rounded-3xl p-5 text-center transition-all ${
              selected === mood.id ? "ring-2 ring-violet-400" : ""
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${mood.gradient} opacity-10`} />
            <div className="relative text-4xl">{mood.emoji}</div>
            <div className="relative mt-3 text-sm font-semibold text-white">{mood.label}</div>
            <div className="relative mt-1 text-[11px] text-zinc-400">{mood.description}</div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-10"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">
              Picked for your {moods.find((m) => m.id === selected)?.label.toLowerCase()} mood
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {results.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
