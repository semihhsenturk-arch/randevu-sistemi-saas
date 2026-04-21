"use client"

import * as React from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale/tr"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ date, setDate, placeholder, className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full h-12 px-4 justify-start text-left font-bold text-[0.82rem] rounded-xl bg-white border border-slate-200 hover:border-[#0a3d34]/40 hover:bg-emerald-50/20 shadow-sm hover:shadow-md transition-all duration-300 focus-visible:ring-[#0a3d34] group",
            !date && "text-slate-400 font-medium",
            className
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0a3d34] flex items-center justify-center mr-3 group-hover:bg-[#0a3d34] group-hover:text-white transition-colors duration-300">
            <CalendarIcon className="h-4 w-4" />
          </div>
          {date ? format(date, "d MMMM yyyy", { locale: tr }) : <span>{placeholder || "Tarih Seçin"}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] rounded-[24px] bg-white/95 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-300 overflow-hidden" 
        align="start" 
        sideOffset={12}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={tr}
        />
      </PopoverContent>
    </Popover>
  )
}
