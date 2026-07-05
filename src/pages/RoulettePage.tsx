import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Dice5, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "@/hooks/useGeolocation";
import { searchNearbyRestaurants } from "@/services/restaurantService";
import { mockRestaurants } from "@/data/mockRestaurants";
import type { Restaurant } from "@/types";
import { Button } from "@/components/ui/Button";
import { RestaurantCard } from "@/components/shared/RestaurantCard";
import { Confetti } from "@/components/shared/Confetti";
import { LoadingState } from "@/components/shared/StateViews";

const CARD_WIDTH = 168;
const REPEAT = 10;

const MODES = [
  { id: "nearby", label: "Nearby" },
  { id: "cheap", label: "Cheap" },
  { id: "rated", label: "Highly Rated" },
  { id: "open", label: "Open Now" },
  { id: "gems", label: "Hidden Gems" },
] as const;

type Mode = (typeof MODES)[number]["id"];

function reasonFor(r: Restaurant, mode: Mode): string {
  switch (mode) {
    case "cheap": return `Budget-friendly at ${"$".repeat(r.priceLevel)} and still rated ${r.rating.toFixed(1)}★.`;
    case "rated": return `One of the highest-rated spots nearby at ${r.rating.toFixed(1)}★.`;
    case "open": return `Open right now and ${r.distanceMiles ?? "a few"} miles away.`;
    case "gems": return `A hidden gem locals love but doesn't always show up first.`;
    default: return `Close by at ${r.distanceMiles ?? "a short"} miles and rated ${r.rating.toFixed(1)}★.`;
  }
}

export function RoulettePage() {
  const navigate = useNavigate();
  const { coords, requestBrowserLocation } = useGeolocation();
  const [mode, setMode] = useState<Mode>("nearby");
  const [pool, setPool] = useState<Restaurant[]>(mockRestaurants);
  const [loadingPool, setLoadingPool] = useState(false);

  useEffect(() => {
    if (!coords) return;
    setLoadingPool(true);
    searchNearbyRestaurants(coords).then(setPool).catch(() => {}).finally(() => setLoadingPool(false));
  }, [coords]);

  const filteredPool = useMemo(() => {
    let list = [...pool];
    if (mode === "cheap") list = list.filter((r) => r.priceLevel <= 2);
    if (mode === "rated") list = list.filter((r) => r.rating >= 4.5);
    if (mode === "open") list = list.filter((r) => r.openNow === true);
    if (mode === "gems") list = list.filter((r) => r.isHiddenGem);
    if (list.length === 0) list = pool;
    return list;
  }, [pool, mode]);

  const strip = useMemo(
    () => Array.from({ length: REPEAT }, () => filteredPool).flat(),
    [filteredPool]
  );

  const [offset, setOffset] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [spinCount, setSpinCount] = useState(0);

  const spin = () => {
    if (filteredPool.length === 0) return;
    setSpinning(true);
    setWinner(null);
    const winIndex = Math.floor(Math.random() * filteredPool.length);
    const targetGlobalIndex = filteredPool.length * (REPEAT - 3) + winIndex;
    const newOffset = -(targetGlobalIndex * CARD_WIDTH) - CARD_WIDTH / 2;
    setOffset(newOffset);
    setSpinCount((c) => c + 1);
    setTimeout(() => {
      setSpinning(false);
      setWinner(filteredPool[winIndex]);
    }, 3200);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 text-center">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-zinc-300">
        <Dice5 size={13} className="text-fuchsia-400" /> Food Roulette
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-white">Can't decide? Let fate pick.</h1>
      <p className="mt-2 text-sm text-zinc-400">Spin the wheel and commit to a real restaurant nearby.</p>

      {!coords && (
        <div className="mt-4">
          <Button size="sm" variant="glass" onClick={() => requestBrowserLocation().catch(() => {})}>
            Use My Location for better picks
          </Button>
        </div>
      )}

      <div
        className="no-scrollbar mt-6 flex justify-start gap-2 overflow-x-auto px-1 sm:justify-center"
        style={{ maskImage: "linear-gradient(to right, transparent, black 16px, black 92%, transparent)" }}
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`relative shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-violet-400/60 ${
              mode === m.id ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {mode === m.id && <motion.div layoutId="roulette-pill" className="absolute inset-0 rounded-full bg-white/10" />}
            <span className="relative z-10">{m.label}</span>
          </button>
        ))}
      </div>

      {loadingPool ? (
        <LoadingState message="Finding restaurants near you..." />
      ) : (
        <div className="glass-strong relative mt-6 overflow-hidden rounded-3xl p-6">
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-[168px] -translate-x-1/2 border-x-2 border-fuchsia-400/60" />
          <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0b0b14] to-transparent" />
          <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0b0b14] to-transparent" />

          <div className="relative h-40 overflow-hidden">
            <motion.div
              key={spinCount}
              className="absolute left-1/2 top-0 flex h-40 items-center"
              initial={{ x: 0 }}
              animate={{ x: offset }}
              transition={spinning ? { duration: 3.2, ease: [0.12, 0.75, 0.24, 1] } : { duration: 0 }}
            >
              {strip.map((r, i) => (
                <div
                  key={i}
                  className="mx-1 flex h-32 w-40 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-cover bg-center shadow-lg"
                  style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.6)), url(${r.image})` }}
                >
                  <div className="px-2 text-center text-sm font-semibold text-white line-clamp-2">{r.name}</div>
                  <div className="text-xs text-zinc-300">{r.cuisine}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {winner && !spinning && <Confetti />}
        </div>
      )}

      {winner && !spinning && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 18 }}
          className="mt-6 space-y-4"
        >
          <p className="text-sm text-zinc-400">Tonight, you're having</p>
          <p className="text-2xl font-semibold text-gradient">{winner.name}</p>
          <p className="mx-auto max-w-md text-sm text-zinc-400">{reasonFor(winner, mode)}</p>
          <div className="mx-auto max-w-sm">
            <RestaurantCard restaurant={winner} compact />
          </div>
          <Button size="md" variant="glass" onClick={() => navigate(`/restaurant/${winner.id}`)}>
            <ExternalLink size={14} /> Open Restaurant Page
          </Button>
        </motion.div>
      )}

      <div className="mt-8">
        <Button size="lg" onClick={spin} disabled={spinning || loadingPool}>
          {spinning ? "Spinning..." : winner ? "Spin Again" : "Spin"}
        </Button>
      </div>
    </div>
  );
}
