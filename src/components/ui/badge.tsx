import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "plus" | "premium" | "featured" | "success";
  className?: string;
}) {
  const styles = {
    default: "bg-pisome-alice text-pisome-blue",
    plus: "bg-pisome-sky text-pisome-blue-dark",
    premium: "bg-pisome-navy text-white",
    featured: "bg-pisome-blue-dark text-[#dbeafe]",
    success: "bg-emerald-50 text-pisome-success",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold tracking-wide",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
