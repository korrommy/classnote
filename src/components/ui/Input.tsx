import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-dark-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-[1rem] border-[2.5px] border-outline bg-paper px-4 py-3 text-base font-normal text-dark-text",
            "shadow-brutal-sm outline-none placeholder:text-dark-text/40",
            "focus:shadow-brutal focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";
