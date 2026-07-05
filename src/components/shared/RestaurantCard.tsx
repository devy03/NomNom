import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, Clock, Sparkles } from "lucide-react";
import type { Restaurant } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { estimateAveragePrice } from "@/services/restaurantService";

export function RestaurantCard({ restaurant, compact }: { restaurant: Restaurant; compact?: boolean }) {
  const navigate = useNavigate();
  const r = restaurant;

  return (
    <motion.button
      onClick={() => navigate(`/restaurant/${r.id}`)}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="glass group w-full cursor-pointer overflow-hidden rounded-3xl text-left outline-none transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/40 focus-visible:ring-2 focus-visible:ring-violet-400/60"
    >
      <div className={cn("relative overflow-hidden", compact ? "h-32" : "h-44")}>
        <motion.img
          src={r.image}
          alt={r.name}
          className="h-full w-full object-cover"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {r.isHiddenGem && <Badge tone="accent">⭐ Hidden Gem</Badge>}
          {r.isNew && <Badge tone="success">New</Badge>}
        </div>
        <div className="absolute right-3 top-3">
          {r.openNow !== "unknown" && (
            <Badge tone={r.openNow ? "success" : "danger"}>{r.openNow ? "Open" : "Closed"}</Badge>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <h3 className="text-lg font-semibold text-white drop-shadow">{r.name}</h3>
          <div className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {r.rating > 0 ? r.rating.toFixed(1) : "—"}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {r.distanceMiles != null ? `${r.distanceMiles} mi` : "—"}
            </span>
            <span>{r.cuisine}</span>
            <span>{"$".repeat(r.priceLevel)} · ~${estimateAveragePrice(r)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
            <span>{r.reviewsCount > 0 ? `${r.reviewsCount.toLocaleString()} reviews` : "New listing"}</span>
            {r.waitTimeMins != null && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {r.waitTimeMins > 0 ? `${r.waitTimeMins} min wait` : "No wait"}
              </span>
            )}
          </div>
          {r.matchReason && (
            <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-violet-500/10 px-2.5 py-2 text-[11px] text-violet-200">
              <Sparkles size={12} className="mt-0.5 shrink-0" /> {r.matchReason}
            </div>
          )}
          {!r.matchReason && r.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.tags.slice(0, 2).map((t) => (
                <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] capitalize text-zinc-300">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.button>
  );
}
