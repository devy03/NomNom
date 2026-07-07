import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, ArrowRight, Clock } from "lucide-react";
import { getUserGroupHistory, getUserParticipatedRooms } from "@/services/groupService";
import { useAuth } from "@/hooks/useAuth";
import type { GroupRoom } from "@/types";
import { Button } from "@/components/ui/Button";

interface GroupHistoryProps {
  onRejoin?: (roomCode: string) => void;
}

export function GroupHistory({ onRejoin }: GroupHistoryProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"created" | "participated" | "all">("created");
  const [createdRooms, setCreatedRooms] = useState<GroupRoom[]>([]);
  const [participatedRooms, setParticipatedRooms] = useState<GroupRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [created, participated] = await Promise.all([
          getUserGroupHistory(user.id, 7),
          getUserParticipatedRooms(user.id, 7),
        ]);
        setCreatedRooms(created);
        setParticipatedRooms(participated.filter((r) => r.createdBy !== user.id));
      } catch (error) {
        console.error("Failed to load group history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.id]);

  const rooms =
    tab === "created" ? createdRooms : tab === "participated" ? participatedRooms : [...createdRooms, ...participatedRooms];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar size={32} className="mx-auto mb-3 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          {tab === "created" ? "No group rooms created yet" : tab === "participated" ? "No groups joined yet" : "No group history"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {(["created", "participated", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-3 text-sm font-medium transition-colors ${
              tab === t ? "border-b-2 border-violet-400 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t === "created" ? "Created" : t === "participated" ? "Joined" : "All"}
          </button>
        ))}
      </div>

      {/* Room List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="space-y-2"
        >
          {rooms.map((room, idx) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group glass rounded-2xl p-4 hover:bg-white/[0.08] transition-colors cursor-pointer"
              onClick={() => onRejoin?.(room.roomCode)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {room.roomName || `Group on ${new Date(room.createdAt).toLocaleDateString()}`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                    <Clock size={12} />
                    <span>{formatDate(room.createdAt)}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                    <Users size={12} className="text-violet-400" />
                    <span className="text-xs text-zinc-300">0</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  {/* Placeholder for member avatars */}
                  <div className="flex -space-x-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-xs text-white"
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                </div>

                <Button size="sm" variant="glass" className="group-hover:bg-white/20">
                  Rejoin <ArrowRight size={12} />
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
