import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * Single global background for the whole app. One dark base plus several
 * slow-drifting glow blobs spread across the full viewport (including the
 * top, behind the nav) so the whole screen reads as equally "alive" no
 * matter where content scrolls to. Fixed positioning + no vertical fade
 * means there's nothing that varies with scroll position, so there's no
 * seam between any two sections of any page.
 */
export function AmbientBackground() {
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (lightRef.current) {
        lightRef.current.style.transform = `translate(${e.clientX - 350}px, ${e.clientY - 350}px)`;
      }
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const particles = Array.from({ length: 12 });

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#05050a]">
      <motion.div
        className="absolute -inset-[15%]"
        style={{
          background:
            "radial-gradient(55% 55% at 20% 20%, rgba(139,92,246,0.30) 0%, transparent 72%)," +
            "radial-gradient(50% 50% at 80% 15%, rgba(236,72,153,0.22) 0%, transparent 72%)," +
            "radial-gradient(60% 60% at 50% 50%, rgba(99,102,241,0.16) 0%, transparent 72%)," +
            "radial-gradient(55% 55% at 78% 82%, rgba(56,189,248,0.24) 0%, transparent 72%)," +
            "radial-gradient(48% 48% at 18% 85%, rgba(249,115,22,0.16) 0%, transparent 72%)",
        }}
        animate={{
          transform: [
            "translate(0%, 0%) scale(1)",
            "translate(2%, 3%) scale(1.06)",
            "translate(-2%, -1%) scale(1.02)",
            "translate(1%, -2%) scale(1)",
            "translate(0%, 0%) scale(1)",
          ],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        ref={lightRef}
        className="absolute top-0 left-0 h-[700px] w-[700px] rounded-full bg-violet-400/[0.10] blur-[140px] transition-transform duration-700 ease-out"
      />

      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/20"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            width: 2 + (i % 3),
            height: 2 + (i % 3),
          }}
          animate={{ y: [0, -26, 0], opacity: [0.08, 0.45, 0.08] }}
          transition={{ duration: 7 + (i % 5), repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
