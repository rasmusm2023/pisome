import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-pisome-blue text-white hover:bg-pisome-blue-dark shadow-sm shadow-pisome-blue/20",
  secondary: "bg-pisome-navy text-white hover:bg-pisome-navy/90",
  accent:
    "bg-pisome-accent text-white hover:bg-pisome-accent-hover shadow-sm shadow-pisome-accent/25",
  ghost: "bg-transparent text-pisome-navy hover:bg-pisome-alice",
  outline:
    "border border-pisome-border bg-white text-pisome-navy hover:border-pisome-blue hover:bg-pisome-alice",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
