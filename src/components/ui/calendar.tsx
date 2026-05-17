"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ReactCalendar, { CalendarProps as ReactCalendarProps } from "react-calendar"
import { tr } from "date-fns/locale"

import { cn } from "@/lib/utils"

export type CalendarProps = ReactCalendarProps & {
  className?: string;
}

function Calendar({
  className,
  ...props
}: CalendarProps) {
  return (
    <div className={cn(className)}>
      <ReactCalendar
        className="w-full border-0 font-sans"
        locale="tr-TR"
        prevLabel={<ChevronLeft className="h-4 w-4" />}
        nextLabel={<ChevronRight className="h-4 w-4" />}
        prev2Label={null}
        next2Label={null}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
