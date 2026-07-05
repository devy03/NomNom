import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFoodPreferences } from "@/services/profileService";
import { generateInsights, defaultInsights, type GeneratedInsight } from "@/lib/insightGenerator";

export function InsightMarquee() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<GeneratedInsight[]>(defaultInsights);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setIsLoading(true);
        const prefs = await getFoodPreferences(user?.id);
        const isNewUser = !prefs || !prefs.favoriteCuisines || prefs.favoriteCuisines.length === 0;
        const generated = generateInsights(prefs || null, isNewUser);
        setInsights(generated);
      } catch (error) {
        console.error("Failed to load insights:", error);
        setInsights(defaultInsights);
      } finally {
        setIsLoading(false);
      }
    };

    loadInsights();
  }, [user?.id]);

  // Duplicate insights for seamless loop
  const duplicatedInsights = [...insights, ...insights];

  // Total width calculation: estimate based on insight text length
  const totalInsightWidth = insights.reduce((sum, insight) => {
    return sum + Math.max(insight.text.length * 8 + 40, 200); // ~8px per char + gap
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="group relative overflow-hidden rounded-2xl px-5 py-4"
      style={{
        background:
          "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.06) 100%)",
        border: "1px solid rgba(139,92,246,0.2)",
        backdropFilter: "blur(20px) saturate(150%)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow background for icon */}
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 h-20 w-20 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-violet-500/15 transition-colors duration-500" />

      <div className="flex items-center gap-3">
        {/* Brain icon */}
        <motion.div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Brain size={16} />
        </motion.div>

        {/* Marquee ticker */}
        <div
          className="relative overflow-hidden flex-1"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          }}
        >
          <motion.div
            ref={marqueeRef}
            className="flex gap-8 w-fit"
            animate={{ x: isHovered ? 0 : -totalInsightWidth }}
            transition={{
              duration: isHovered ? 0 : Math.max(totalInsightWidth / 40, 30), // Slower speed for longer text
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {isLoading ? (
              // Loading shimmer
              <div className="flex gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 w-48 rounded bg-white/10" />
                ))}
              </div>
            ) : (
              // Insights with separators
              duplicatedInsights.map((insight, i) => (
                <div key={i} className="flex items-center gap-8 shrink-0 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-300">{insight.text}</span>
                    <span className="text-xs text-violet-400/60">{insight.icon}</span>
                  </div>
                  {i < duplicatedInsights.length - 1 && (
                    <motion.div
                      className="w-1 h-1 rounded-full bg-violet-400/40"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* Hover indicator */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
        animate={{ opacity: isHovered ? 0.5 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
