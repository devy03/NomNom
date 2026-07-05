import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { getAIRecommendation } from "@/services/aiService";
import { searchNearbyRestaurants } from "@/services/restaurantService";
import { mockRestaurants } from "@/data/mockRestaurants";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { Restaurant } from "@/types";
import { RestaurantCard } from "@/components/shared/RestaurantCard";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  restaurants?: Restaurant[];
}

const suggestions = [
  "I want tacos", "I don't know what I want", "I'm broke",
  "I only have 30 minutes", "I'm vegetarian", "I'm celebrating", "I'm on a date",
];

export function ChatPage() {
  const location = useLocation();
  const { coords } = useGeolocation();
  const initial = (location.state as { initialQuery?: string } | null)?.initialQuery;

  const [pool, setPool] = useState<Restaurant[]>(mockRestaurants);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hey! I'm your food assistant. Tell me how you're feeling, what you're craving, or just say you have no idea — I've got you either way.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const firedInitial = useRef(false);

  useEffect(() => {
    if (!coords) return;
    searchNearbyRestaurants(coords).then(setPool).catch(() => {});
  }, [coords]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await getAIRecommendation(text, pool);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "ai", text: res.text, restaurants: res.restaurants },
      ]);
    } finally {
      setTyping(false);
    }
  };

  useEffect(() => {
    if (initial && !firedInitial.current) {
      firedInitial.current = true;
      send(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col px-4">
      <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto pb-4 pr-1">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div className={m.role === "user" ? "max-w-[75%]" : "max-w-[90%]"}>
                {m.role === "ai" && (
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-violet-300">
                    <Sparkles size={12} /> NomNom
                  </div>
                )}
                <div
                  className={
                    m.role === "user"
                      ? "rounded-3xl rounded-tr-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 px-5 py-3 text-sm text-white shadow-lg shadow-fuchsia-500/20"
                      : "glass rounded-3xl rounded-tl-lg px-5 py-3 text-sm text-zinc-100"
                  }
                >
                  {m.text}
                </div>
                {m.restaurants && m.restaurants.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {m.restaurants.map((r) => (
                      <RestaurantCard key={r.id} restaurant={r} compact />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="glass flex items-center gap-1.5 rounded-3xl rounded-tl-lg px-5 py-4">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length < 3 && (
        <div
          className="no-scrollbar mb-3 flex gap-2 overflow-x-auto px-1 pb-1"
          style={{ maskImage: "linear-gradient(to right, transparent, black 16px, black 92%, transparent)" }}
        >
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="glass shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs text-zinc-300 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="glass-strong mb-2 flex items-center gap-2 rounded-2xl p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none"
        />
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          type="submit"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
        >
          <Send size={16} />
        </motion.button>
      </form>
    </div>
  );
}
