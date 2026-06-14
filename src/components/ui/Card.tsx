import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, as: Tag = "div", ...props }, ref) => {
    return (
      <Tag
        ref={ref as never}
        className={cn(
          "rounded-[1.35rem] border-[2.5px] border-outline bg-card p-4 shadow-brutal",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
