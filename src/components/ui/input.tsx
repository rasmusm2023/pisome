"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, useId } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const floatLabelClass =
  "pointer-events-none absolute left-3.5 top-1.5 z-10 max-w-[calc(100%-1.75rem)] origin-left truncate text-[11px] font-semibold text-pisome-navy transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-pisome-muted peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-pisome-blue peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-pisome-navy";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, id, placeholder, required, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  if (!label) {
    return (
      <input
        ref={ref}
        id={inputId}
        required={required}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-xl border border-pisome-border bg-white px-3.5 text-sm text-pisome-navy outline-none transition placeholder:text-pisome-muted/70 focus:border-pisome-blue focus:ring-2 focus:ring-pisome-blue/15",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        id={inputId}
        required={required}
        placeholder=" "
        className={cn(
          "peer h-16 w-full rounded-xl border border-pisome-border bg-white px-3.5 pb-2 pt-6 text-sm leading-tight text-pisome-navy outline-none transition placeholder:text-transparent focus:border-pisome-blue focus:ring-2 focus:ring-pisome-blue/15",
          className,
        )}
        {...props}
      />
      <label htmlFor={inputId} className={floatLabelClass}>
        {label}
        {required ? " *" : ""}
      </label>
    </div>
  );
});
