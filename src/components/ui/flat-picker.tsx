"use client"

import React, { useEffect, useRef } from "react"
import flatpickr from "flatpickr"
import { Turkish } from "flatpickr/dist/l10n/tr"
import "flatpickr/dist/flatpickr.css"
import { cn } from "@/lib/utils"

interface FlatPickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  options?: any
}

export function FlatPicker({ value, onChange, placeholder, className, options }: FlatPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const instanceRef = useRef<any>(null)

  useEffect(() => {
    if (inputRef.current) {
      instanceRef.current = flatpickr(inputRef.current, {
        locale: Turkish,
        altInput: true,
        altFormat: "d-m-Y",
        dateFormat: "Y-m-d",
        defaultDate: value,
        onChange: (selectedDates, dateStr) => {
          onChange(dateStr)
        },
        ...options,
      })
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy()
      }
    }
  }, []) // Initialize only once

  // Update value if it changes from outside
  useEffect(() => {
    if (instanceRef.current && value !== undefined && value !== instanceRef.current.input.value) {
      instanceRef.current.setDate(value, false)
    }
  }, [value])

  return (
    <input
      ref={inputRef}
      placeholder={placeholder}
      className={cn(
        "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-[0.9rem] text-slate-900 bg-white focus:outline-none focus:border-[#0a3d34] focus:ring-3 focus:ring-[#0a3d34]/10 transition-all text-center h-11",
        className
      )}
      style={{ display: 'none' }} // Explicitly hide the original input
    />
  )
}
