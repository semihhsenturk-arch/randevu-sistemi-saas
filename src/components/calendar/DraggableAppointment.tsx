"use client";

import { memo, forwardRef, HTMLAttributes } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Appointment, Service } from "@/hooks/use-database";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DraggableAppointmentProps {
  appointment: Appointment;
  service: Service | undefined;
  onClick: (apt: Appointment) => void;
  style?: React.CSSProperties;
}

const AppointmentCard = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    setNodeRef: (element: HTMLElement | null) => void;
  }
>(function AppointmentCard({ setNodeRef, ...props }, ref) {
  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as any).current = node;
        }
      }}
      {...props}
    />
  );
});

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
    <TooltipProvider delayDuration={isDragging ? 99999 : 300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AppointmentCard
            setNodeRef={setNodeRef}
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
          </AppointmentCard>
        </TooltipTrigger>
        <TooltipContent 
          className="bg-slate-950 border border-slate-800 text-white shadow-2xl z-[9999] p-2.5 rounded-xl font-sans pointer-events-none" 
          sideOffset={4} 
          side="top"
          style={{ 
            maxWidth: 'var(--radix-tooltip-trigger-width)', 
            whiteSpace: 'normal', 
            wordBreak: 'break-word' 
          }}
        >
          <div className="flex flex-col items-center text-center gap-1.5">
            <span className="font-extrabold text-[0.8rem] text-white leading-tight w-full line-clamp-2 pb-1 border-b border-slate-800/80">
              {appointment.musteriAdi}
            </span>
            <div className="flex flex-col mt-0.5 w-full">
              <span className="text-[0.58rem] text-emerald-400 font-extrabold uppercase tracking-wider">Hizmet</span>
              <span className="text-[0.68rem] text-slate-100 font-semibold leading-tight w-full line-clamp-2 mt-[1px]">
                {service?.ad || "Bilinmeyen Hizmet"}
              </span>
            </div>
            {appointment.notlar && appointment.notlar.trim() !== "" && (
              <>
                <div className="w-12 my-0.5 border-t border-slate-800" />
                <div className="flex flex-col w-full">
                   <span className="text-[0.58rem] text-slate-400 font-extrabold uppercase tracking-wider">Not</span>
                   <span className="text-[0.62rem] text-slate-200 font-semibold leading-tight w-full line-clamp-3 mt-[1px]">
                     {appointment.notlar}
                   </span>
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
