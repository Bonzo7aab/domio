"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
import { LucideIcon } from "lucide-react";

const menuDockVariants = cva(
  "flex items-center justify-center gap-1 rounded-full border border-border bg-muted",
  {
    variants: {
      variant: {
        default: "px-2 py-2",
        compact: "px-1.5 py-1.5",
        large: "px-3 py-3",
      },
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col",
      },
    },
    defaultVariants: {
      variant: "default",
      orientation: "horizontal",
    },
  }
);

const menuDockItemVariants = cva(
  "relative flex items-center justify-center rounded-lg transition-all duration-200 ease-out cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "w-12 h-12",
        compact: "w-10 h-10",
        large: "w-14 h-14",
      },
      active: {
        true: "scale-110 bg-primary/15 text-primary",
        false: "hover:scale-105 hover:bg-accent/50",
      },
    },
    defaultVariants: {
      variant: "default",
      active: false,
    },
  }
);

export interface MenuDockItem {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  badge?: number;
}

export interface MenuDockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof menuDockVariants> {
  items: MenuDockItem[];
  showLabels?: boolean;
}

const MenuDock = React.forwardRef<HTMLDivElement, MenuDockProps>(
  (
    {
      className,
      variant,
      orientation,
      items,
      showLabels = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(menuDockVariants({ variant, orientation }), className)}
        {...props}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const content = (
            <div
              key={index}
              className={cn(
                menuDockItemVariants({
                  variant,
                  active: item.active,
                }),
                "group"
              )}
              onClick={item.onClick}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "transition-all duration-200",
                    item.active
                      ? "text-primary scale-110"
                      : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"
                  )}
                  size={variant === "compact" ? 18 : variant === "large" ? 24 : 20}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold text-white bg-destructive rounded-full border-2 border-background">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              {showLabels && (
                <span
                  className={cn(
                    "absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap transition-opacity duration-200",
                    item.active ? "opacity-100 text-primary" : "opacity-70 text-foreground/70"
                  )}
                >
                  {item.label}
                </span>
              )}
            </div>
          );

          if (item.href) {
            return (
              <a
                key={index}
                href={item.href}
                className="no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  if (item.onClick) item.onClick();
                  else if (item.href) window.location.href = item.href;
                }}
              >
                {content}
              </a>
            );
          }

          return content;
        })}
      </div>
    );
  }
);

MenuDock.displayName = "MenuDock";

export { MenuDock, menuDockVariants };

