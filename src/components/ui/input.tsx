import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-pisome-border bg-white px-3.5 text-sm text-pisome-navy outline-none transition placeholder:text-pisome-muted/70 focus:border-pisome-blue focus:ring-2 focus:ring-pisome-blue/15",
        className,
      )}
      {...props}
    />
  );
});
