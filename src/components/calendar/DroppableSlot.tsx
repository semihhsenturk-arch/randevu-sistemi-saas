"use client";

import { useDroppable } from "@dnd-kit/core";

interface DroppableSlotProps {
  id: string; // e.g., "2024-04-19_09:00"
  date: string;
  time: string;
  onClick: () => void;
  children?: React.ReactNode;
}

export function DroppableSlot({ id, date, time, onClick, children }: DroppableSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { date, time }
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`slot ${isOver ? "drag-over" : ""}`}
    >
      {children}
    </div>
  );
}
