import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, MapPin, Clock, Heart, Navigation, Share2, Phone, Globe, Sparkles,
} from "lucide-react";
import { getRestaurantDetails, searchNearbyRestaurants } from "@/services/restaurantService";
import { addFavorite, isFavorite, removeFavorite } from "@/services/favoritesService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RestaurantCard } from "@/components/shared/RestaurantCard";
import { LoadingState, ErrorState } from "@/components/shared/StateViews";
import type { Restaurant } from "@/types";

function buildMatchSummary(r: Restaurant): string {
  const bits: string[] = [];
  if (r.rating >= 4.5) bits.push(`consistently rated ${r.rating.toFixed(1)}★`);
  if (r.distanceMiles != null && r.distanceMiles <= 1.5) bits.push("close by");
  if (r.isHiddenGem) bits.push("a local favorite that doesn't show up on every list");
  if (r.priceLevel <= 2) bits.push("easy on the budget");
  if (r.openNow === true) bits.push("open right now");
  if (bits.length === 0) return `${r.name} is a solid pick in ${r.cuisine} food nearby.`;
  return `${r.name} is a good match — ${bits.join(", ")}.`;
}

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coords } = useGeolocation();
  const { toast } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [similar, setSimilar] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getRestaurantDetails(id, coords ?? undefined)
      .then(async (r) => {
        if (cancelled) return;
        setRestaurant(r);
        setActivePhoto(0);
        const fav = await isFavorite(user?.id, r.id).catch(() => false);
        if (!cancelled) setSaved(fav);
        const nearby = await searchNearbyRestaurants(r.location).catch(() => []);
        if (!cancelled) setSimilar(nearby.filter((n) => n.id !== r.id && n.cuisine === r.cuisine).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setError("We couldn't load this restaurant. It may no longer be available.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleFavorite = async () => {
    if (!restaurant) return;
    try {
      if (saved) {
        await removeFavorite(user?.id, restaurant.id);
        setSaved(false);
        toast("Removed from favorites", "info");
      } else {
        await addFavorite(user?.id, restaurant);
        setSaved(true);
        toast("Saved to favorites", "success");
      }
    } catch {
      toast("Couldn't update favorites right now.", "error");
    }
  };

  if (loading) return <LoadingState message="Loading restaurant details..." />;

  if (error || !restaurant) {
    return (
      <div className="mx-auto max-w-2xl px-6">
        <ErrorState
          title="Restaurant not found"
          description={error ?? "This restaurant may no longer be available."}
          onRetry={() => navigate("/nearby")}
        />
      </div>
    );
  }

  const r = restaurant;
  const photos = r.photos.length > 0 ? r.photos : [r.image];

  return (
    <div className="mx-auto max-w-4xl px-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft size={15} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl">
        <img src={photos[activePhoto]} alt={r.name} className="h-72 w-full object-cover sm:h-96" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute right-4 top-4 flex gap-2">
          <button onClick={toggleFavorite} className="glass flex h-10 w-10 items-center justify-center rounded-full">
            <Heart size={17} className={saved ? "fill-rose-500 text-rose-500" : "text-white"} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href).catch(() => {});
              toast("Link copied", "success");
            }}
            className="glass flex h-10 w-10 items-center justify-center rounded-full"
          >
            <Share2 size={16} className="text-white" />
          </button>
        </div>
        <div className="absolute bottom-5 left-6 right-6">
          <div className="flex flex-wrap gap-1.5">
            {r.isHiddenGem && <Badge tone="accent">⭐ Hidden Gem</Badge>}
            {r.isNew && <Badge tone="success">New</Badge>}
            {r.openNow !== "unknown" && <Badge tone={r.openNow ? "success" : "danger"}>{r.openNow ? "Open Now" : "Closed"}</Badge>}
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-white drop-shadow-lg sm:text-4xl">{r.name}</h1>
          <p className="text-sm text-zinc-300">{r.cuisine} · {"$".repeat(r.priceLevel)}</p>
        </div>
      </motion.div>

      {photos.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p + i}
              onClick={() => setActivePhoto(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition-all ${
                activePhoto === i ? "ring-violet-400" : "ring-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Star, label: "Rating", value: r.rating > 0 ? `${r.rating.toFixed(1)} / 5` : "New" },
          { icon: MapPin, label: "Distance", value: r.distanceMiles != null ? `${r.distanceMiles} mi` : "—" },
          { icon: Clock, label: "Reviews", value: r.reviewsCount > 0 ? r.reviewsCount.toLocaleString() : "—" },
          { icon: Sparkles, label: "Price", value: "$".repeat(r.priceLevel) },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-4 text-center">
            <stat.icon size={16} className="mx-auto mb-1.5 text-violet-400" />
            <div className="text-sm font-semibold capitalize text-white">{stat.value}</div>
            <div className="text-[11px] text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="glass mt-6 rounded-3xl p-6">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
          <Sparkles size={14} className="text-violet-400" /> Why this matches you
        </h3>
        <p className="text-sm text-zinc-300">{buildMatchSummary(r)}</p>
      </div>

      {r.hours && r.hours.length > 0 && (
        <div className="glass mt-6 rounded-3xl p-6">
          <h3 className="mb-3 text-sm font-semibold text-white">Hours</h3>
          <ul className="space-y-1 text-sm text-zinc-400">
            {r.hours.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </div>
      )}

      <div className="glass mt-6 rounded-3xl p-6">
        <h3 className="mb-3 text-sm font-semibold text-white">Menu</h3>
        <p className="text-sm text-zinc-500">Menu details aren't available yet for this restaurant — check their website or call ahead.</p>
      </div>

      <div className="glass mt-6 rounded-3xl p-6">
        <h3 className="mb-3 text-sm font-semibold text-white">Reviews</h3>
        {r.reviewsCount > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-amber-400">
              <Star size={16} className="fill-amber-400" /> <span className="text-lg font-semibold text-white">{r.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-zinc-400">based on {r.reviewsCount.toLocaleString()} reviews</span>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No reviews yet.</p>
        )}
      </div>

      {similar.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-lg font-semibold text-white">Similar Restaurants</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {similar.map((s) => <RestaurantCard key={s.id} restaurant={s} compact />)}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={r.mapsUrl} target="_blank" rel="noreferrer">
          <Button size="lg"><Navigation size={16} /> Directions</Button>
        </a>
        {r.phone && (
          <a href={`tel:${r.phone}`}>
            <Button size="lg" variant="glass"><Phone size={15} /> Call</Button>
          </a>
        )}
        {r.website && (
          <a href={r.website} target="_blank" rel="noreferrer">
            <Button size="lg" variant="glass"><Globe size={15} /> Website</Button>
          </a>
        )}
      </div>

      <div className="glass-strong mt-10 mb-4 rounded-3xl p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Address</p>
        <p className="mt-1.5 text-base font-medium text-white">{r.address}</p>
      </div>
    </div>
  );
}
