import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "success" | "warning" | "danger" | "accent";
}) {
  const tones: Record<string, string> = {
    default: "bg-white/8 text-zinc-200 border-white/10",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/20",
    danger: "bg-rose-500/15 text-rose-300 border-rose-500/20",
    accent: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
