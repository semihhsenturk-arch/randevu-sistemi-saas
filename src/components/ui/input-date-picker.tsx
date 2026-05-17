"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { tr } from "date-fns/locale/tr"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface InputDatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
  className?: string
}

export function InputDatePicker({ date, setDate, placeholder, className }: InputDatePickerProps) {
  const [inputValue, setInputValue] = React.useState<string>("")
  const [isOpen, setIsOpen] = React.useState(false)

  // Sync internal input value with external date prop
  React.useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, "dd.MM.yyyy"))
    } else {
      setInputValue("")
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Try to parse the date (expecting DD.MM.YYYY)
    if (value.length === 10) {
      const parsedDate = parse(value, "dd.MM.yyyy", new Date())
      if (isValid(parsedDate)) {
        setDate(parsedDate)
      }
    }
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder || "GG.AA.YYYY"}
        className="h-12 pr-12 font-bold text-[0.85rem] border-slate-200 focus-visible:ring-[#0a3d34] rounded-xl"
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 h-8 w-8 text-slate-400 hover:text-[#0a3d34] hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[320px] p-0 border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] rounded-[24px] bg-white/95 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-300 overflow-hidden" 
          align="end" 
          sideOffset={8}
        >
          <Calendar
            value={date || null}
            onChange={(val) => {
              setDate(val ? (val as Date) : undefined)
              setIsOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
