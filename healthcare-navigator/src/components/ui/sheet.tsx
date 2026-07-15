"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 animate-fade-in"
            onClick={() => onOpenChange?.(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 h-full w-3/4 max-w-sm bg-background shadow-lg animate-slide-in-right">
            {children}
          </div>
        </>
      )}
    </>
  );
}

function SheetContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col h-full", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-2 p-6 border-b", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export { Sheet, SheetContent, SheetHeader, SheetTitle };
