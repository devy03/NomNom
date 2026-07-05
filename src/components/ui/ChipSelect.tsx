import { cn } from "@/lib/utils";

export function ChipSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              "rounded-full px-3.5 py-2 text-xs font-medium transition-all",
              active
                ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/25"
                : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
