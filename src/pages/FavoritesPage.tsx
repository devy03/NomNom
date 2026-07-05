import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Star, Trash2 } from "lucide-react";
import { getFavorites, removeFavorite } from "@/services/favoritesService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { LoadingState, EmptyState } from "@/components/shared/StateViews";
import type { FavoriteRestaurant } from "@/types";

export function FavoritesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFavorites(user?.id)
      .then((f) => !cancelled && setFavorites(f))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleRemove = async (placeId: string) => {
    try {
      await removeFavorite(user?.id, placeId);
      setFavorites((f) => f.filter((x) => x.placeId !== placeId));
      toast("Removed from favorites", "info");
    } catch {
      toast("Couldn't remove favorite", "error");
    }
  };

  if (loading) return <LoadingState message="Loading your saved places..." />;

  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-zinc-300">
          <Heart size={13} className="text-rose-400" /> Your Wallet
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Saved Places</h1>
        <p className="mt-2 text-sm text-zinc-400">The ones you keep coming back to.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Heart}
            title="No saved places yet"
            description="Tap the heart icon on any restaurant to save it here."
            action={{ label: "Find Restaurants", onClick: () => navigate("/nearby") }}
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass group overflow-hidden rounded-3xl"
            >
              <button onClick={() => navigate(`/restaurant/${f.placeId}`)} className="block w-full text-left">
                <div className="relative h-40">
                  <img src={f.photoUrl} alt={f.restaurantName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <h3 className="text-base font-semibold text-white drop-shadow">{f.restaurantName}</h3>
                    <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs text-white">
                      <Star size={11} className="fill-amber-400 text-amber-400" /> {f.rating?.toFixed(1) ?? "—"}
                    </span>
                  </div>
                </div>
              </button>
              <div className="flex items-center justify-between p-3">
                <p className="truncate text-xs text-zinc-400">{f.address}</p>
                <button onClick={() => handleRemove(f.placeId)} className="shrink-0 text-zinc-500 hover:text-rose-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
