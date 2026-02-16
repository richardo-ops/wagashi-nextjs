//配置された商品にダブルクリック時のコンテキストメニューについてのコンポーネント

"use client"

import type React from "react"

import type { PlacedItem } from "@/types/types"
import { Trash2, Lock, Unlock, RotateCw, Info, ArrowUpWideNarrowIcon as ArrowsHorizontal } from "lucide-react"

interface ContextMenuProps {
  x: number
  y: number
  item: PlacedItem
  onDelete: (id: string) => void
  onToggleLock: (id: string) => void
  onRotate: (id: string) => void
  onResize?: (id: string) => void
  onShowInfo?: (item: PlacedItem) => void
  onClose: () => void
}

export default function ContextMenu({
  x,
  y,
  item,
  onDelete,
  onToggleLock,
  onRotate,
  onResize,
  onShowInfo,
  onClose,
}: ContextMenuProps) {
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShowInfo) {
      onShowInfo(item)
    }
  }

  const handleResizeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onResize) {
      onResize(item.id)
    }
  }

  return (
    <div
      className="fixed z-50 bg-white shadow-lg rounded-sm overflow-hidden border border-[var(--color-indigo-light)]"
      style={{
        left: x,
        top: y,
        minWidth: "150px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="py-1">
        <li
          data-testid="context-menu-delete"
          className="px-4 py-2 hover:bg-[var(--color-beige)] flex items-center cursor-pointer group relative"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4 mr-2 text-[var(--color-red)]" />
          <span>削除</span>
          <span className="absolute left-0 top-0 w-0.5 h-full bg-[var(--color-red)] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
        </li>
        <li
          className="px-4 py-2 hover:bg-[var(--color-beige)] flex items-center cursor-pointer group relative"
          onClick={() => onToggleLock(item.id)}
        >
          {item.isLocked ? (
            <>
              <Unlock className="h-4 w-4 mr-2 text-[var(--color-indigo)]" />
              <span>アンロック</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2 text-[var(--color-indigo)]" />
              <span>ロック</span>
            </>
          )}
          <span className="absolute left-0 top-0 w-0.5 h-full bg-[var(--color-indigo)] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
        </li>
        {item.type === "sweet" && (
          <li
            data-testid="context-menu-rotate"
            className="px-4 py-2 hover:bg-[var(--color-beige)] flex items-center cursor-pointer group relative"
            onClick={() => onRotate(item.id)}
          >
            <RotateCw className="h-4 w-4 mr-2 text-[var(--color-indigo)]" />
            <span>回転</span>
            <span className="absolute left-0 top-0 w-0.5 h-full bg-[var(--color-indigo)] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
          </li>
        )}
        {item.type === "divider" && onResize && (
          <li
            className="px-4 py-2 hover:bg-[var(--color-beige)] flex items-center cursor-pointer group relative"
            onClick={handleResizeClick}
          >
            <ArrowsHorizontal className="h-4 w-4 mr-2 text-[var(--color-indigo)]" />
            <span>長さ調整</span>
            <span className="absolute left-0 top-0 w-0.5 h-full bg-[var(--color-indigo)] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
          </li>
        )}
        {item.type === "sweet" && (
          <li
            className="px-4 py-2 hover:bg-[var(--color-beige)] flex items-center cursor-pointer group relative"
            onClick={handleInfoClick}
          >
            <Info className="h-4 w-4 mr-2 text-[var(--color-indigo)]" />
            <span>商品情報</span>
            <span className="absolute left-0 top-0 w-0.5 h-full bg-[var(--color-indigo)] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
          </li>
        )}
      </ul>
    </div>
  )
}
