"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right";
}

const TooltipContext = React.createContext<{
  show: boolean;
  setShow: (show: boolean) => void;
}>({
  show: false,
  setShow: () => {},
});

function Tooltip({ children }: TooltipProps) {
  const [show, setShow] = React.useState(false);
  return (
    <TooltipContext.Provider value={{ show, setShow }}>
      <div className="relative inline-block">
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({ children, className, ...props }: TooltipTriggerProps) {
  const { setShow } = React.useContext(TooltipContext);
  return (
    <div
      className={cn("inline-block", className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      {...props}
    >
      {children}
    </div>
  );
}

function TooltipContent({ className, side = "top", children, ...props }: TooltipContentProps) {
  const { show } = React.useContext(TooltipContext);

  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-fade-in",
        side === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-2",
        side === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-2",
        side === "left" && "right-full top-1/2 -translate-y-1/2 mr-2",
        side === "right" && "left-full top-1/2 -translate-y-1/2 ml-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent };
