"use client";

import { useState } from "react";
import { Filter, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface TableColumnFilterProps {
  title: string;
  options: string[];
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
  align?: "start" | "center" | "end";
}

export function TableColumnFilter({
  title,
  options,
  selectedValues,
  onFilterChange,
  align = "start"
}: TableColumnFilterProps) {
  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onFilterChange(selectedValues.filter(v => v !== option));
    } else {
      onFilterChange([...selectedValues, option]);
    }
  };

  const isActive = selectedValues.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-300 transition-colors select-none justify-center">
          {title}
          <Filter className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400 fill-emerald-400/20" : "text-slate-400 opacity-70"}`} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 bg-white" align={align}>
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-500 px-2 py-1.5 mb-1 border-b border-slate-100">
            Filtrele: {title}
          </div>
          <div className="max-h-[250px] overflow-y-auto custom-scrollbar-auto pr-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <div
                  key={option}
                  onClick={() => toggleOption(option)}
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 cursor-pointer rounded-md text-sm text-slate-700 transition-colors"
                >
                  <span className="truncate">{option || "(Boş)"}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
              );
            })}
            {options.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-4">Seçenek bulunamadı</div>
            )}
          </div>
          {selectedValues.length > 0 && (
            <div className="pt-2 mt-1 border-t border-slate-100">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => onFilterChange([])}
              >
                Temizle
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
