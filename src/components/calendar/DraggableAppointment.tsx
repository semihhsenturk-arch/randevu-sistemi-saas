"use client";

import { useDraggable } from "@dnd-kit/core";
import { Appointment } from "@/hooks/use-database";
import { CSS } from "@dnd-kit/utilities";

interface DraggableAppointmentProps {
  appointment: Appointment;
  service: { id: number; ad: string; renk: string; sure: number } | undefined;
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
      <span className="apt-name">{appointment.musteriAdi}</span>
      <span className="apt-service">{service?.ad || "Bilinmeyen Hizmet"}</span>
    </div>
  );
}
