"use client"

import { useDraggable } from "@dnd-kit/core"
import type { DividerItem } from "@/types/types"

interface DividerItemProps {
  item: DividerItem
}

export default function DividerItemComponent({ item }: DividerItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `divider-${item.id}`,
    data: {
      id: item.id,
      type: "divider",
      item,
      width: item.orientation === "horizontal" ? item.length : 1,
      height: item.orientation === "vertical" ? item.length : 1,
      isGridLine: true,
      orientation: item.orientation,
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`bg-white border border-[var(--color-indigo-light)] rounded-sm p-1.5 sm:p-2 cursor-move ${
        isDragging ? "opacity-50" : "opacity-100"
      } hover:shadow-md transition-shadow duration-200 relative overflow-hidden group`}
      style={{ touchAction: "none" }}
    >
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
          <div className={`bg-[var(--color-indigo)] ${item.orientation === "horizontal" ? "w-12 sm:w-16 h-0.5 sm:h-1" : "w-0.5 sm:w-1 h-12 sm:h-16"}`} />
        </div>
        <h3 className="text-xs sm:text-sm font-medium text-[var(--color-indigo)] text-center leading-tight">{item.name}</h3>
        <p className="text-[10px] sm:text-xs text-[var(--color-gray)]">
          {item.orientation === "horizontal" ? "横" : "縦"} {item.length}マス
        </p>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-indigo)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  )
}