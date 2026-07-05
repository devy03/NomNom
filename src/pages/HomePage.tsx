import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { dashboardCards } from "@/data/mockData";
import { AIOrb } from "@/components/shared/AIOrb";
import { InsightMarquee } from "@/components/shared/InsightMarquee";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/profileService";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("Food Explorer");

  useEffect(() => {
    getProfile(user?.id).then((p) => {
      if (p?.displayName) setDisplayName(p.displayName);
    });
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-medium text-zinc-400"
          >
            {getGreeting()},
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-semibold tracking-tight text-white"
          >
            {displayName} <span className="text-gradient">.</span>
          </motion.h1>
        </div>
        <AIOrb size={90} />
      </div>

      {/* Insight Marquee Ticker */}
      <div className="mt-8">
        <InsightMarquee />
      </div>

      {/* Cards grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {dashboardCards.map((card, i) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(card.path)}
            className={`group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br ${card.gradient} glass p-5 text-left outline-none transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/30 focus-visible:ring-2 focus-visible:ring-violet-400/60`}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-transform duration-500 group-hover:scale-150" />
            <div className="mb-8 text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
              {card.emoji}
            </div>
            <h3 className="text-base font-semibold text-white">{card.title}</h3>
            <p className="mt-1 text-xs text-zinc-400">{card.subtitle}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
