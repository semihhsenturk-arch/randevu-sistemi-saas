"use client";

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Appointment, Service } from "@/hooks/use-database";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DraggableAppointmentProps {
  appointment: Appointment;
  service: Service | undefined;
  onClick: (apt: Appointment) => void;
  style?: React.CSSProperties;
}

export const DraggableAppointment = memo(function DraggableAppointment({ appointment, service, onClick, style }: DraggableAppointmentProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: appointment.id,
    data: { appointment }
  });

  const dndStyle: React.CSSProperties = {
    ...style,
    // GPU layer promotion
    willChange: 'transform, opacity',
    transform: 'translate3d(0, 0, 0)',
    WebkitBackfaceVisibility: 'hidden',
    backfaceVisibility: 'hidden',
    transition: 'opacity 0.15s ease, border-color 0.15s ease',
    // Ghost mode during drag — Teams-style faded dashed card at original position
    ...(isDragging ? {
      opacity: 0.25,
      pointerEvents: 'none' as const,
      borderStyle: 'dashed',
      borderWidth: '1.5px',
      borderLeftWidth: '3px',
      filter: 'grayscale(0.4)',
      boxShadow: 'none',
    } : {
      opacity: 1,
      pointerEvents: 'auto' as const,
    }),
  };

  return (
    <TooltipProvider delayDuration={isDragging ? 99999 : 800}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={(e) => {
              if (isDragging) return;
              e.stopPropagation();
              onClick(appointment);
            }}
            style={dndStyle}
            className={`appointment-card-legacy ${appointment.durum} group`}
          >
            <span className="apt-name pointer-events-none" title=" ">{appointment.musteriAdi}</span>
            <span className="apt-service pointer-events-none" title=" ">{service?.ad || "Bilinmeyen Hizmet"}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 border-slate-800 text-white shadow-xl z-[9999] px-3 py-2" sideOffset={5} side="top">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[0.85rem]">{appointment.musteriAdi}</span>
            <span className="text-[0.75rem] text-slate-300 font-medium">Hizmet: {service?.ad || "Bilinmeyen Hizmet"}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
