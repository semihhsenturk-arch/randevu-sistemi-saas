"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-5 bg-white rounded-[24px]", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 font-sans",
        month: "space-y-4",
        month_caption: "flex justify-center relative items-center mb-6 h-10",
        caption_label: "text-[1rem] font-black text-[#0a3d34] tracking-tight uppercase",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 border-slate-200 rounded-lg hover:border-[#0a3d34] hover:text-[#0a3d34] shadow-sm transition-all duration-200 absolute left-1 top-1/2 -translate-y-1/2 z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 border-slate-200 rounded-lg hover:border-[#0a3d34] hover:text-[#0a3d34] shadow-sm transition-all duration-200 absolute right-1 top-1/2 -translate-y-1/2 z-10"
        ),
        month_grid: "w-full border-collapse select-none",
        weekdays: "flex w-full mb-3 mt-4 px-1",
        weekday: "text-slate-400 font-bold text-[0.68rem] uppercase tracking-[0.15em] text-center flex items-center justify-center h-9 w-9 flex-1",
        weeks: "w-full mt-1 px-1",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center focus-within:relative focus-within:z-20 h-9 w-9 flex items-center justify-center flex-1",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-extrabold text-[0.85rem] text-slate-600 hover:bg-emerald-50 hover:text-[#0a3d34] rounded-[14px] transition-all duration-300 flex items-center justify-center relative"
        ),
        selected: cn(
          "!bg-[#0a3d34] !text-white hover:!bg-[#072b25] hover:!text-white focus:!bg-[#0a3d34] focus:!text-white rounded-[14px] shadow-[0_12px_24px_-8px_rgba(10,61,52,0.5)] scale-105 font-black !opacity-100"
        ),
        today: cn(
          "bg-emerald-100/50 text-[#0a3d34] ring-2 ring-emerald-500/30",
          "!font-black after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-emerald-600 after:rounded-full"
        ),
        outside: "text-slate-300 opacity-20 aria-selected:bg-slate-100/50 aria-selected:text-slate-400 aria-selected:opacity-20",
        disabled: "text-slate-100 opacity-50 cursor-not-allowed",
        range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeft className="h-4 w-4" />
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
