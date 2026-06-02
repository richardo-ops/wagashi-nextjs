"use client"

import { useEffect } from "react"
import { useDraggable } from "@dnd-kit/core"
import type { SweetItem } from "@/types/types"
import { AlertCircle } from "lucide-react"

interface SweetItemProps {
  item: SweetItem
  onTap?: (item: SweetItem) => void
  disableDragging?: boolean
}

export default function SweetItemComponent({ item, onTap, disableDragging = false }: SweetItemProps) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `sweet-${item.id}`,
    disabled: disableDragging || !item.inStock,
    data: {
      id: item.id,
      type: "sweet",
      item,
      width: item.width * 10,
      height: item.height * 10,
    },
  })

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  const handleTouchStart = () => {
    // iOS Safari debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[sweet-item] touch start', { id: item.id, inStock: item.inStock })
    }
  }

  const handleClick = () => {
    if (onTap && item.inStock) {
      onTap(item)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onTap || !item.inStock) return

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onTap(item)
    }
  }

  useEffect(() => {
    if (transform && process.env.NODE_ENV === "development") {
      console.log(`[sweet-item] move: ${transform.x}, ${transform.y}`)
    }
  }, [transform])

  return (
    <div
      ref={setNodeRef}
      {...(disableDragging ? {} : listeners)}
      {...(disableDragging ? {} : attributes)}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      draggable={false}
      data-testid={`sweet-item-${item.id}`}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      className={`bg-white border border-[var(--color-indigo-light)] rounded-sm p-2 sm:p-3 ${
        item.inStock ? "cursor-move" : "cursor-not-allowed opacity-60"
      } ${onTap ? "cursor-pointer" : ""} ${isDragging ? "opacity-50" : "opacity-100"} hover:shadow-md transition-shadow duration-200 relative overflow-hidden group`}
      style={{ 
        touchAction: "none",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-medium text-[var(--color-indigo)] leading-tight truncate">{item.name}</h3>
            {!item.inStock && (
              <span className="inline-flex items-center rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                在庫切れ
              </span>
            )}
            {onTap && item.inStock && (
              <span className="inline-flex items-center rounded-sm bg-[var(--color-indigo)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                追加
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs text-[var(--color-gray)]">
            <span>{item.price}円</span>
            <span>
              {item.width}×{item.height}
            </span>
          </div>
        </div>

        {!item.inStock && (
          <div className="flex items-center text-red-600 text-[10px] sm:text-xs shrink-0">
            <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            <span>在庫切れ</span>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-indigo)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  )
}