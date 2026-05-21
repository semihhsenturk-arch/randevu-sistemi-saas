"use client"

import React, { useState } from "react"
import { format, parse, isValid } from "date-fns"
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

interface FlatPickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  options?: any
}

export function FlatPicker({ value, onChange, placeholder, className, options }: FlatPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // value is expected to be "yyyy-MM-dd"
  const dateValue = value && value.length === 10 ? parse(value, "yyyy-MM-dd", new Date()) : undefined
  const displayValue = dateValue && isValid(dateValue) ? format(dateValue, "dd-MM-yyyy") : ""

  const handleSelect = (newDate: Date | null) => {
    if (newDate) {
      onChange(format(newDate, "yyyy-MM-dd"))
    }
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-[0.9rem] text-slate-900 bg-white hover:bg-emerald-50 focus:border-[#0a3d34] focus:ring-3 focus:ring-[#0a3d34]/10 transition-all text-center h-11 justify-between",
            !displayValue && "text-slate-400 font-medium",
            className
          )}
        >
          <span>{displayValue || placeholder || "Tarih Seç"}</span>
          <CalendarIcon className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[240px] p-0 border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] rounded-[16px] bg-white/95 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-300 overflow-hidden" 
        align="start" 
        sideOffset={8}
        collisionPadding={16}
      >
        <Calendar
          value={dateValue || null}
          onChange={(val) => handleSelect(val as Date)}
        />
      </PopoverContent>
    </Popover>
  )
}
