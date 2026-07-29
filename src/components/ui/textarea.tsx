import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-xl border border-pisome-border bg-white px-3.5 py-3 text-sm text-pisome-navy outline-none transition placeholder:text-pisome-muted/70 focus:border-pisome-blue focus:ring-2 focus:ring-pisome-blue/15",
        className,
      )}
      {...props}
    />
  );
});
