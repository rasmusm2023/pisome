import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-pisome-border bg-white px-3.5 text-sm text-pisome-navy outline-none transition focus:border-pisome-blue focus:ring-2 focus:ring-pisome-blue/15",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
