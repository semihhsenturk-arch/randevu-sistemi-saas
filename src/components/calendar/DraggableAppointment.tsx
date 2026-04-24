"use client";

import { useDraggable } from "@dnd-kit/core";
import { Appointment, Service } from "@/hooks/use-database";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DraggableAppointmentProps {
  appointment: Appointment;
  service: Service | undefined;
  onClick: (apt: Appointment) => void;
  style?: React.CSSProperties;
}

export function DraggableAppointment({ appointment, service, onClick, style }: DraggableAppointmentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: { appointment }
  });

  const dndStyle = {
    // Hide the original element completely during drag to leave no 'trail'
    opacity: isDragging ? 0 : 1,
    visibility: isDragging ? "hidden" as const : "visible" as const,
    pointerEvents: isDragging ? "none" as const : "auto" as const,
    ...style
  };

  return (
    <TooltipProvider delayDuration={1000}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={(e) => {
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
}
