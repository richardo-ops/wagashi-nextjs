"use client"

import { useDrag } from "react-dnd"
import type { SweetItem } from "@/types/types"
import { useRef } from "react"
import { AlertCircle } from "lucide-react"

interface SweetItemProps {
  item: SweetItem
}

export default function SweetItemComponent({ item }: SweetItemProps) {
  const elementRef = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "sweet",
    item: (monitor) => {
      // 在庫切れの場合はドラッグを許可しない
      if (!item.inStock) {
        return null
      }

      // ドラッグ開始時の要素の位置を取得
      const initialClientOffset = monitor.getInitialClientOffset()
      const initialSourceClientOffset = monitor.getInitialSourceClientOffset()

      // 要素内でのクリック位置（オフセット）を計算
      let offsetX = 0
      let offsetY = 0

      if (initialClientOffset && initialSourceClientOffset) {
        offsetX = initialClientOffset.x - initialSourceClientOffset.x
        offsetY = initialClientOffset.y - initialSourceClientOffset.y
      }

      return {
        id: item.id,
        type: "sweet",
        item,
        width: item.width*10,//mmとcmの補完のため商品サイズを10倍
        height: item.height*10,
        offsetX,
        offsetY,
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: item.inStock, // 在庫切れの場合はドラッグを許可しない
  }))

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  const handlekpointerDown = (e: React.PointerEvent) => {
    // タッチ操作やペン操作の場合、デフォルトの動作を防止
    if (e.pointerType !== "mouse") {
      e.preventDefault()
    }
  }

  return (
    <div
      ref={(node) => {
        elementRef.current = node
        drag(node)
      }}
      onContextMenu={handleContextMenu}
      onPointerDown={handlekpointerDown}
      draggable={false}
      data-testid={`sweet-item-${item.id}`}
      className={`bg-white border border-[var(--color-indigo-light)] rounded-sm p-1.5 sm:p-2 ${
        item.inStock ? "cursor-move" : "cursor-not-allowed opacity-60"
      } ${isDragging ? "opacity-50" : "opacity-100"} hover:shadow-md transition-shadow duration-200 relative overflow-hidden group`}
    >
      <div className="flex flex-col items-center">
        {/* レスポンシブな画像コンテナ */}
        <div
          className={`relative mb-1 sm:mb-2 border border-[var(--color-indigo-light)] bg-white rounded-sm overflow-hidden flex items-center justify-center ${
            !item.inStock ? "grayscale" : ""
          } w-12 h-12 sm:w-16 sm:h-16`}
        >
          {/* 画像自体はobject-fitでコンテナ内に収める */}
          <img src={item.imageUrl || "/placeholder.svg"} alt={item.name} className="w-full h-full object-contain" />

          {!item.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <span className="text-white text-[10px] sm:text-xs font-bold px-0.5 sm:px-1 py-0.5 bg-red-600 rounded-sm">在庫切れ</span>
            </div>
          )}
        </div>

        <h3 className="text-xs sm:text-sm font-medium text-[var(--color-indigo)] text-center leading-tight">{item.name}</h3>
        <p className="text-[10px] sm:text-xs text-[var(--color-gray)]">{item.price}円</p>
        <p className="text-[10px] sm:text-xs text-[var(--color-gray)]">
          {item.width}×{item.height}
        </p>
        {!item.inStock && (
          <div className="flex items-center mt-0.5 sm:mt-1 text-red-600 text-[10px] sm:text-xs">
            <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            <span>在庫切れ</span>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-indigo)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  )
}
