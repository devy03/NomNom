import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

const RADAR_FOODS = ["🍕", "🍔", "🍣", "🌮", "🍜", "🥗", "🍦", "🍛"];
const SWEEP_DURATION = 8;

export function AIOrb({
  size = 260,
  className,
  radar = false,
}: {
  size?: number;
  className?: string;
  /** Shows food emojis around the outer ring that pop in as a radar sweep
   * passes their position, then fade out. Meant for the landing page hero —
   * leave off for smaller inline uses so it doesn't feel cluttered. */
  radar?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 120, damping: 18 });
  const springY = useSpring(my, { stiffness: 120, damping: 18 });
  const rotateX = useTransform(springY, [-40, 40], [12, -12]);
  const rotateY = useTransform(springX, [-40, 40], [-12, 12]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left - rect.width / 2;
    const py = e.clientY - rect.top - rect.height / 2;
    mx.set(Math.max(-40, Math.min(40, px / 4)));
    my.set(Math.max(-40, Math.min(40, py / 4)));
  };

  const handleLeave = () => {
    mx.set(0);
    my.set(0);
    setHovered(false);
  };

  const radarRadius = size / 2 + 50;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size, perspective: 800 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-violet-400/20"
          style={{ width: size + i * 50, height: size + i * 50 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 18 + i * 6, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {radar && (
        <>
          {/* Sweeping radar line — food icons pop as it passes them. */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: size + 100,
              height: size + 100,
              background: "conic-gradient(from 0deg, transparent 0deg, rgba(196,181,253,0.28) 12deg, transparent 30deg)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: SWEEP_DURATION, repeat: Infinity, ease: "linear" }}
          />

          {RADAR_FOODS.map((emoji, i) => {
            const angle = (i / RADAR_FOODS.length) * 360;
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * radarRadius;
            const y = Math.sin(rad) * radarRadius;
            // conic-gradient's 0deg points to 12 o'clock and sweeps
            // clockwise, while our x/y angle convention starts at 3 o'clock
            // — offset by 90deg so the icon pop lines up with the sweep.
            const cssAngle = (angle + 90) % 360;
            const delay = (cssAngle / 360) * SWEEP_DURATION;
            return (
              <motion.div
                key={emoji}
                className="absolute text-2xl"
                style={{
                  left: "50%",
                  top: "50%",
                  marginLeft: x - 16,
                  marginTop: y - 16,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.15, 1, 0.3] }}
                transition={{
                  duration: 1.6,
                  times: [0, 0.25, 0.7, 1],
                  delay,
                  repeat: Infinity,
                  repeatDelay: SWEEP_DURATION - 1.6,
                  ease: "easeOut",
                }}
              >
                {emoji}
              </motion.div>
            );
          })}
        </>
      )}

      <motion.div
        style={{ rotateX, rotateY }}
        animate={{ scale: hovered ? 1.06 : 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative"
      >
        <motion.div
          className="animate-orb-pulse rounded-full"
          style={{
            width: size * 0.72,
            height: size * 0.72,
            background:
              "radial-gradient(circle at 35% 30%, #f0abfc, #a855f7 35%, #6366f1 65%, #22d3ee 100%)",
            boxShadow:
              "0 0 90px 10px rgba(168,85,247,0.45), 0 0 160px 40px rgba(34,211,238,0.2), inset 0 0 60px rgba(255,255,255,0.25)",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full mix-blend-overlay"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.5), transparent 40%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            top: "18%",
            left: "22%",
            background: "radial-gradient(circle, rgba(255,255,255,0.85), transparent 70%)",
            filter: "blur(4px)",
          }}
        />
      </motion.div>
    </div>
  );
}
