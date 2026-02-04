import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number; max?: number }
>(({ className, value = 50, max = 100, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative w-full h-2 bg-secondary rounded-full", className)}
    {...props}
  >
    <div
      className="absolute h-full bg-primary rounded-full"
      style={{ width: `${(value / max) * 100}%` }}
    />
    <div
      className="absolute w-4 h-4 bg-primary rounded-full top-1/2 -translate-y-1/2 shadow-md"
      style={{ left: `${(value / max) * 100}%`, transform: `translate(-50%, -50%)` }}
    />
  </div>
))
Slider.displayName = "Slider"

export { Slider }
