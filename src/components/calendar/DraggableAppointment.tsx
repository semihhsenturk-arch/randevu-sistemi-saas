"use client";

import { memo, forwardRef, HTMLAttributes } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Appointment, Service } from "@/hooks/use-database";

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
  );
});
