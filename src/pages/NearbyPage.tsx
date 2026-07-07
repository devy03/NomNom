import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RestaurantCard } from "@/components/shared/RestaurantCard";
import { SkeletonGrid, EmptyState, ErrorState } from "@/components/shared/StateViews";
import { searchNearbyRestaurants } from "@/services/restaurantService";
import { enrichTopResults } from "@/services/photoEnrichmentService";
import type { Restaurant } from "@/types";
import { useToast } from "@/hooks/useToast";

const filters = [
  { id: "all", label: "All" },
  { id: "gems", label: "Hidden Gems" },
  { id: "healthy", label: "Healthy" },
  { id: "fastfood", label: "Fast Food" },
  { id: "dessert", label: "Dessert" },
  { id: "open", label: "Open Now" },
  { id: "cheap", label: "$" },
];

const FAST_FOOD_TAG_HINTS = [
  "fast food restaurant",
  "hamburger restaurant",
  "pizza restaurant",
  "sandwich shop",
  "meal takeaway",
];

export function NearbyPage() {
  const { coords, label, status, errorMessage, requestBrowserLocation, setManualLocation } = useGeolocation();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const activeFilter = params.get("f") ?? "all";
  const [manualInput, setManualInput] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    searchNearbyRestaurants(coords)
      .then((results) => {
        if (cancelled) return;
        setRestaurants(results);
        setLoading(false);
        // Enrich the first page of cards with real photos/contact info in
        // the background so the initial list isn't delayed waiting on it.
        enrichTopResults(results, 12, coords).then((enriched) => {
          if (!cancelled) setRestaurants(enriched);
        });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Couldn't load restaurants right now.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  const handleUseLocation = async () => {
    try {
      await requestBrowserLocation();
      toast("Using your current location", "success");
    } catch {
      toast("Location denied — enter a city or ZIP below", "error");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    try {
      const found = await setManualLocation(manualInput);
      toast(`Showing restaurants near ${manualInput}`, "success");
      void found;
    } catch {
      toast("Couldn't find that location. Try a city or ZIP code.", "error");
    }
  };

  const filtered = useMemo(() => {
    let list = restaurants;
    if (activeFilter === "gems") list = list.filter((r) => r.isHiddenGem);
    if (activeFilter === "healthy") list = list.filter((r) => r.tags.includes("healthy") || r.cuisine === "Mediterranean");
    if (activeFilter === "fastfood") list = list.filter((r) => r.tags.some((t) => FAST_FOOD_TAG_HINTS.includes(t)));
    if (activeFilter === "dessert") list = list.filter((r) => r.cuisine === "Dessert");
    if (activeFilter === "open") list = list.filter((r) => r.openNow === true);
    if (activeFilter === "cheap") list = list.filter((r) => r.priceLevel === 1);
    return list;
  }, [restaurants, activeFilter]);

  if (!coords) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
          <LocateFixed size={26} />
        </div>
        <h1 className="text-2xl font-semibold text-white">Find food near you</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We'll only use your location to find nearby restaurants — nothing is stored beyond this session.
        </p>

        <Button size="lg" className="mt-6 w-full" onClick={handleUseLocation} disabled={status === "requesting"}>
          <LocateFixed size={16} /> {status === "requesting" ? "Requesting location..." : "Use My Location"}
        </Button>

        {errorMessage && <p className="mt-3 text-sm text-amber-400">{errorMessage}</p>}

        <div className="my-6 flex items-center gap-3 text-xs text-zinc-600">
          <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="City, ZIP, or address"
          />
          <Button type="submit" variant="glass" disabled={status === "requesting"}>
            <Search size={15} />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Nearby</h1>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-zinc-400 sm:justify-start">
            <MapPin size={13} /> Showing places near {label ?? "you"}
          </p>
        </div>
        <Button size="sm" variant="glass" onClick={handleUseLocation}>
          <LocateFixed size={14} /> Update Location
        </Button>
      </div>

      <div
        className="no-scrollbar mt-6 flex gap-2 overflow-x-auto px-1"
        style={{ maskImage: "linear-gradient(to right, transparent, black 16px, black 92%, transparent)" }}
      >
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setParams(f.id === "all" ? {} : { f: f.id })}
            className={`relative shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-violet-400/60 ${
              activeFilter === f.id ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {activeFilter === f.id && (
              <motion.div layoutId="nearby-pill" className="absolute inset-0 rounded-full bg-white/10" />
            )}
            <span className="relative z-10">{f.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading && <SkeletonGrid />}
        {!loading && loadError && (
          <ErrorState description={loadError} onRetry={() => setManualLocation(label ?? "")} />
        )}
        {!loading && !loadError && filtered.length === 0 && (
          <EmptyState title="No restaurants match" description="Try a different filter or expand your search area." />
        )}
        {!loading && !loadError && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <RestaurantCard restaurant={r} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
