"use client";

import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef, useId } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, children, label, id, ...props }, ref) {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    if (!label) {
      return (
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-11 w-full cursor-pointer rounded-xl border border-pisome-border bg-white px-3.5 text-sm text-pisome-navy outline-none transition focus:border-pisome-blue focus:ring-2 focus:ring-pisome-blue/15",
            className,
          )}
          {...props}
        >
          {children}
        </select>
      );
    }

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-16 w-full cursor-pointer rounded-xl border border-pisome-border bg-white px-3.5 pb-2 pt-6 text-sm leading-tight text-pisome-navy outline-none transition focus:border-pisome-blue focus:ring-2 focus:ring-pisome-blue/15",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <label
          htmlFor={selectId}
          className="pointer-events-none absolute left-3.5 top-1.5 z-10 text-[11px] font-semibold text-pisome-navy"
        >
          {label}
          {props.required ? " *" : ""}
        </label>
      </div>
    );
  },
);
