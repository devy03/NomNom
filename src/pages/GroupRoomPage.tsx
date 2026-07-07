import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Check, Users, Sparkles, ThumbsUp, ThumbsDown, Crown, DollarSign, MapPinned, Gem, ShieldCheck } from "lucide-react";
import {
  findRoomByCode, getGroupPreferences, getMembers, joinRoom, savePreferences, subscribeToRoom,
} from "@/services/groupService";
import { searchNearbyRestaurants } from "@/services/restaurantService";
import { computeGroupMatch } from "@/lib/groupMatch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ChipSelect } from "@/components/ui/ChipSelect";
import { RestaurantCard } from "@/components/shared/RestaurantCard";
import { LoadingState, ErrorState } from "@/components/shared/StateViews";
import { CUISINE_OPTIONS, DISLIKED_FOOD_OPTIONS, DIETARY_RESTRICTION_OPTIONS, MOOD_OPTIONS, DINING_STYLE_OPTIONS } from "@/data/preferenceOptions";
import { SF_DEFAULT_CENTER } from "@/data/mockRestaurants";
import type { DiningStyle, GroupMatchBreakdown, GroupMember, GroupMemberPreferences, GroupRoom } from "@/types";

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const badgeIcon: Record<NonNullable<GroupMatchBreakdown["badge"]>, typeof Crown> = {
  "Best Overall": Crown,
  "Cheapest Good Option": DollarSign,
  "Closest Good Option": MapPinned,
  "Hidden Gem": Gem,
  "Safest Pick": ShieldCheck,
};

export function GroupRoomPage() {
  const { roomId: roomCode } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { coords, requestBrowserLocation } = useGeolocation();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<GroupRoom | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [allPrefs, setAllPrefs] = useState<GroupMemberPreferences[]>([]);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const [myPrefs, setMyPrefs] = useState<Omit<GroupMemberPreferences, "roomId" | "guestName" | "userId">>({
    budgetMin: 10, budgetMax: 30, maxDistanceMiles: 5, cravings: [], dislikedFoods: [],
    dietaryRestrictions: [], mood: "Happy", diningStyle: "dine-in", spiceLevel: 50, openToNewPlaces: true, isReady: false,
  });

  const [results, setResults] = useState<GroupMatchBreakdown[] | null>(null);
  const [computing, setComputing] = useState(false);

  const storageKey = `nomnom:room:${roomCode}:member`;

  const refetch = useCallback(async () => {
    if (!room) return;
    const [m, p] = await Promise.all([getMembers(room.id), getGroupPreferences(room.id)]);
    setMembers(m);
    setAllPrefs(p);
  }, [room]);

  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;
    (async () => {
      try {
        const found = await findRoomByCode(roomCode).catch(() => null);
        if (cancelled) return;
        setRoom(found);

        if (found) {
          const saved = sessionStorage.getItem(storageKey);
          if (saved) {
            setMyMemberId(JSON.parse(saved).id);
          }
          // If user is already a member, they'll be loaded from session storage
          // Otherwise, they'll need to enter guest name and join
        } else {
          toast("Room not found. Check the invite link.", "error");
        }
      } catch (error) {
        console.error("Failed to load room:", error);
        toast("Couldn't load the room. Try refreshing.", "error");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  useEffect(() => {
    if (!room) return;
    refetch();
    const unsubscribe = subscribeToRoom(room.id, refetch);
    return unsubscribe;
  }, [room, refetch]);

  useEffect(() => {
    if (!myMemberId) return;
    const mine = allPrefs.find((p) => (user?.id ? p.userId === user.id : true) && members.find((m) => m.id === myMemberId)?.guestName === p.guestName);
    if (mine) {
      setMyPrefs({
        budgetMin: mine.budgetMin, budgetMax: mine.budgetMax, maxDistanceMiles: mine.maxDistanceMiles,
        cravings: mine.cravings, dislikedFoods: mine.dislikedFoods, dietaryRestrictions: mine.dietaryRestrictions,
        mood: mine.mood, diningStyle: mine.diningStyle, spiceLevel: mine.spiceLevel, openToNewPlaces: mine.openToNewPlaces, isReady: mine.isReady,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myMemberId, allPrefs.length]);

  const handleJoin = async () => {
    if (!room || !guestNameInput.trim()) return;
    setJoinLoading(true);
    try {
      const member = await joinRoom(room.id, guestNameInput.trim(), user?.id);
      sessionStorage.setItem(storageKey, JSON.stringify({ id: member.id, guestName: member.guestName }));
      setMyMemberId(member.id);
      toast(`Joined room ${room.roomCode}`, "success");
      refetch();
    } catch {
      toast("Couldn't join the room.", "error");
    } finally {
      setJoinLoading(false);
    }
  };

  const myMember = members.find((m) => m.id === myMemberId);

  const handleSavePrefs = async (ready: boolean) => {
    if (!room || !myMember) return;
    try {
      await savePreferences(room.id, myMember.id, myMember.guestName, user?.id, { ...myPrefs, isReady: ready });
      setMyPrefs((p) => ({ ...p, isReady: ready }));
      toast(ready ? "You're marked ready!" : "Preferences saved", "success");
      refetch();
    } catch {
      toast("Couldn't save your preferences.", "error");
    }
  };

  const handleCalculate = async () => {
    if (!room) return;
    setComputing(true);
    setResults(null);
    try {
      let origin = coords;
      if (!origin) {
        origin = await requestBrowserLocation().catch(() => SF_DEFAULT_CENTER);
      }
      const pool = await searchNearbyRestaurants(origin!, { maxDistanceMiles: Math.max(...allPrefs.map((p) => p.maxDistanceMiles), 5) });
      const matches = computeGroupMatch(pool, allPrefs.length > 0 ? allPrefs : [{ ...myPrefs, roomId: room.id, guestName: myMember?.guestName ?? "You" }]);
      setResults(matches);
    } catch {
      toast("Couldn't calculate a group match right now.", "error");
    } finally {
      setComputing(false);
    }
  };

  const copyInvite = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/group/${roomCode}`).catch(() => {});
    toast("Invite link copied", "success");
  };

  if (loading) return <LoadingState message="Loading room..." />;

  if (!room) {
    return (
      <div className="mx-auto max-w-lg px-6">
        <ErrorState title="Room not found" description="This room may have expired or the code is incorrect." />
      </div>
    );
  }

  if (!myMemberId) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-zinc-300">
          <Users size={13} /> Room {room.roomCode}
        </div>
        <h1 className="text-2xl font-semibold text-white">Join this group</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-400">Enter a name so your friends know it's you.</p>
        <div className="glass-strong w-full rounded-3xl p-6">
          <Label>Your Name</Label>
          <Input value={guestNameInput} onChange={(e) => setGuestNameInput(e.target.value)} placeholder="Alex" autoFocus />
          <Button size="lg" className="mt-4 w-full" onClick={handleJoin} disabled={joinLoading || !guestNameInput.trim()}>
            {joinLoading ? "Joining..." : "Join Room"}
          </Button>
        </div>
      </div>
    );
  }

  const readyCount = members.filter((m) => m.isReady).length;

  return (
    <div className="mx-auto max-w-4xl px-6">
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-zinc-300">
          <Users size={13} className="text-violet-400" /> Room {room.roomCode}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Waiting for the group</h1>
        <p className="mt-2 text-sm text-zinc-400">{readyCount} of {members.length} member{members.length !== 1 ? "s" : ""} ready</p>
      </div>

      <div className="glass mt-6 flex items-center justify-between gap-3 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Link2 size={15} className="text-zinc-500" />
          <span className="font-mono">nomnom.app/group/{room.roomCode}</span>
        </div>
        <Button size="sm" variant="glass" onClick={copyInvite}>
          <Link2 size={14} /> Copy Invite
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {members.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-semibold text-white">
              {m.guestName[0]?.toUpperCase()}
            </div>
            <p className="mt-2 truncate text-sm font-medium text-white">{m.guestName}{m.id === myMemberId ? " (you)" : ""}</p>
            <p className={`text-xs ${m.isReady ? "text-emerald-400" : "text-zinc-500"}`}>{m.isReady ? "✓ Ready" : "Setting preferences..."}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass mt-8 space-y-6 rounded-3xl p-6">
        <h2 className="text-sm font-semibold text-white">Your preferences</h2>

        <div>
          <Label>Budget: ${myPrefs.budgetMin} – ${myPrefs.budgetMax}</Label>
          <div className="flex items-center gap-3">
            <input type="range" min={5} max={100} value={myPrefs.budgetMin}
              onChange={(e) => setMyPrefs((p) => ({ ...p, budgetMin: Math.min(Number(e.target.value), p.budgetMax) }))}
              className="w-full accent-violet-500" />
            <input type="range" min={5} max={150} value={myPrefs.budgetMax}
              onChange={(e) => setMyPrefs((p) => ({ ...p, budgetMax: Math.max(Number(e.target.value), p.budgetMin) }))}
              className="w-full accent-fuchsia-500" />
          </div>
        </div>

        <div>
          <Label>Max Distance: {myPrefs.maxDistanceMiles} mi</Label>
          <input type="range" min={1} max={25} value={myPrefs.maxDistanceMiles}
            onChange={(e) => setMyPrefs((p) => ({ ...p, maxDistanceMiles: Number(e.target.value) }))}
            className="w-full accent-cyan-500" />
        </div>

        <div>
          <Label>Spice Tolerance: {myPrefs.spiceLevel}%</Label>
          <input type="range" min={0} max={100} value={myPrefs.spiceLevel}
            onChange={(e) => setMyPrefs((p) => ({ ...p, spiceLevel: Number(e.target.value) }))}
            className="w-full accent-orange-500" />
        </div>

        <div>
          <Label>Cravings</Label>
          <ChipSelect options={CUISINE_OPTIONS} selected={myPrefs.cravings} onToggle={(v) => setMyPrefs((p) => ({ ...p, cravings: toggle(p.cravings, v) }))} />
        </div>

        <div>
          <Label>Foods to Avoid</Label>
          <ChipSelect options={DISLIKED_FOOD_OPTIONS} selected={myPrefs.dislikedFoods} onToggle={(v) => setMyPrefs((p) => ({ ...p, dislikedFoods: toggle(p.dislikedFoods, v) }))} />
        </div>

        <div>
          <Label>Dietary Restrictions</Label>
          <ChipSelect options={DIETARY_RESTRICTION_OPTIONS} selected={myPrefs.dietaryRestrictions} onToggle={(v) => setMyPrefs((p) => ({ ...p, dietaryRestrictions: toggle(p.dietaryRestrictions, v) }))} />
        </div>

        <div>
          <Label>Mood</Label>
          <ChipSelect options={MOOD_OPTIONS} selected={[myPrefs.mood]} onToggle={(v) => setMyPrefs((p) => ({ ...p, mood: v }))} />
        </div>

        <div>
          <Label>Dine-in or Takeout?</Label>
          <ChipSelect
            options={DINING_STYLE_OPTIONS.map((o) => o.label)}
            selected={[DINING_STYLE_OPTIONS.find((o) => o.id === myPrefs.diningStyle)?.label ?? ""]}
            onToggle={(label) => {
              const opt = DINING_STYLE_OPTIONS.find((o) => o.label === label);
              if (opt) setMyPrefs((p) => ({ ...p, diningStyle: opt.id as DiningStyle }));
            }}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Button variant="glass" size="sm" onClick={() => handleSavePrefs(false)}>Save</Button>
          <Button size="sm" onClick={() => handleSavePrefs(true)}>
            <Check size={14} /> I'm Ready
          </Button>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={handleCalculate} disabled={computing}>
          <Sparkles size={16} /> {computing ? "Building your group match..." : "Find Our Match"}
        </Button>
      </div>

      <AnimatePresence>
        {computing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="h-2.5 w-2.5 rounded-full bg-violet-400"
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </motion.div>
        )}

        {results && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-6">
            {(() => {
              const top = results[0];
              return (
                <div className="glass-strong glow-violet relative overflow-hidden rounded-3xl p-8 text-center">
                  <motion.div className="absolute inset-0 mesh-bg opacity-30" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 4, repeat: Infinity }} />
                  <div className="relative">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.2 }}
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl font-bold text-white shadow-lg shadow-fuchsia-500/40">
                      {top.score}%
                    </motion.div>
                    <p className="mt-3 text-sm font-medium text-violet-300">Match Score</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">{top.restaurant.name}</h2>
                    <p className="text-sm text-zinc-400">{top.restaurant.cuisine} · {top.restaurant.distanceMiles ?? "?"} mi away</p>
                    <div className="mx-auto mt-6 max-w-md space-y-2 text-left">
                      {top.reasons.map((r) => (
                        <div key={r.member} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs">
                          {r.happy ? <ThumbsUp size={13} className="shrink-0 text-emerald-400" /> : <ThumbsDown size={13} className="shrink-0 text-amber-400" />}
                          <span className="text-zinc-300"><span className="font-medium text-white">{r.member}</span> {r.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {results.map((r) => (
                <div key={r.restaurant.id} className="relative">
                  {r.badge && (
                    <div className="absolute -top-2 left-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-semibold text-black shadow">
                      {(() => {
                        const Icon = badgeIcon[r.badge];
                        return <Icon size={11} />;
                      })()}
                      {r.badge}
                    </div>
                  )}
                  <RestaurantCard restaurant={{ ...r.restaurant, matchReason: `${r.score}% group match` }} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
