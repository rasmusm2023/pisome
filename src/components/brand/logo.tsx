import { cn } from "@/lib/utils";

export function Logo({
  className,
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <rect width="32" height="32" rx="9" fill="#2563EB" />
        <path
          d="M8 18.5L16 11l8 7.5V24a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 8 24v-5.5Z"
          fill="white"
          fillOpacity="0.95"
        />
        <circle cx="22.5" cy="11.5" r="3.2" fill="#0D9488" />
      </svg>
      {!markOnly && (
        <span className="font-display text-xl font-semibold tracking-tight text-pisome-navy">
          Pisome
        </span>
      )}
    </span>
  );
}
