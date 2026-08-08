"use client";
import { useState } from "react";

// Native HTML5 drag-and-drop reordering for a small pill/icon list — desktop
// mouse-drag only (no touch fallback), which is fine here since this is a
// power-user personalization affordance, not a primary interaction.
export function useDragReorder(items, onReorder) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const getHandlers = (index) => ({
    draggable: true,
    onDragStart: (e) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
    },
    onDragOver: (e) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;
      setDragOverIndex(index);
    },
    onDrop: (e) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;
      const next = [...items];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(index, 0, moved);
      onReorder(next);
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    onDragEnd: () => {
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
  });

  return { draggedIndex, dragOverIndex, getHandlers };
}
