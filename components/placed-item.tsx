"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useDrag } from "react-dnd"
import type { PlacedItem } from "@/types/types"
import { Lock } from "lucide-react"

interface PlacedItemProps {
  item: PlacedItem
  onContextMenu: (e: React.MouseEvent) => void
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItem[]>>
  isNew?: boolean
  cellSize: number
  onDoubleClick?: (item: PlacedItem) => void
  checkValidPlacement?: (x: number, y: number, width: number, height: number, excludeId?: string) => boolean
}

export default function PlacedItemComponent({
  item,
  onContextMenu,
  setPlacedItems,
  isNew = false,
  cellSize = 40,
  onDoubleClick,
  checkValidPlacement,
}: PlacedItemProps) {
  const [isAnimating, setIsAnimating] = useState(isNew)
  const prevPositionRef = useRef({ x: item.x, y: item.y })
  const elementRef = useRef<HTMLDivElement>(null)

  // 新しいアイテムの場合、マウント時にアニメーションを適用
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isNew])

  // 位置が変更されたときにアニメーションを適用
  useEffect(() => {
    const prevPosition = prevPositionRef.current
    if (prevPosition.x !== item.x || prevPosition.y !== item.y) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 300) // アニメーション時間と同じ

      // 現在の位置を保存
      prevPositionRef.current = { x: item.x, y: item.y }

      return () => clearTimeout(timer)
    }
  }, [item.x, item.y])

  // useDrag フックの部分を以下のように修正します
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "placedItem",
      item: (monitor) => {
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
          type: "placedItem",
          width: item.width,
          height: item.height,
          isGridLine: item.isGridLine,
          orientation: item.orientation,
          offsetX,
          offsetY,
        }
      },
      canDrag: !item.isLocked,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [item.id, item.width, item.height, item.isLocked, item.isGridLine, item.orientation], // 依存配列
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (item.isLocked) return

    let newX = item.x
    let newY = item.y

    switch (e.key) {
      case "ArrowUp":
        newY = Math.max(0, item.y - 1)
        break
      case "ArrowDown":
        newY = item.y + 1
        break
      case "ArrowLeft":
        newX = Math.max(0, item.x - 1)
        break
      case "ArrowRight":
        newX = item.x + 1
        break
      default:
        return
    }

    // 配置チェック関数が提供されている場合は、移動先が有効かチェック
    if (checkValidPlacement) {
      const isValid = checkValidPlacement(newX, newY, item.width, item.height, item.id)
      if (!isValid) {
        // 配置NGの場合は移動しない
        e.preventDefault()
        return
      }
    }

    setPlacedItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, x: newX, y: newY } : i)))

    e.preventDefault()
  }

  // グリッドライン上の仕切りの場合の特別なスタイル
  if (item.type === "divider" && item.isGridLine) {
    const dividerStyle = {
      position: "absolute" as const,
      zIndex: 25, // 和菓子（20）よりも高く、ドラッグ中のアイテム（30）よりも低いzIndex
    }

    if (item.orientation === "horizontal") {
      // 水平仕切りの場合
      return (
        <div
          ref={(node) => {
            elementRef.current = node
            drag(node)
          }}
          className={`placed-item ${isDragging ? "opacity-50" : "opacity-100"} ${
            item.isLocked ? "cursor-not-allowed" : "cursor-move"
          } ${isAnimating ? "z-30" : ""} ${isNew ? "placed-item-enter placed-item-enter-active" : ""}`}
          style={{
            ...dividerStyle,
            left: item.x * cellSize,
            top: item.y * cellSize - 2, // 罫線上に配置
            width: item.width * cellSize,
            height: 4, // 仕切りの太さ
          }}
          onContextMenu={onContextMenu}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div className="w-full h-full bg-[var(--color-indigo)] rounded-sm relative">
            {item.isLocked && (
              <div className="absolute -top-3 right-0 bg-white rounded-full p-1">
                <Lock className="h-3 w-3 text-[var(--color-indigo)]" />
              </div>
            )}
          </div>
        </div>
      )
    } else {
      // 垂直仕切りの場合
      return (
        <div
          ref={(node) => {
            elementRef.current = node
            drag(node)
          }}
          className={`placed-item ${isDragging ? "opacity-50" : "opacity-100"} ${
            item.isLocked ? "cursor-not-allowed" : "cursor-move"
          } ${isAnimating ? "z-30" : ""} ${isNew ? "placed-item-enter placed-item-enter-active" : ""}`}
          style={{
            ...dividerStyle,
            left: item.x * cellSize - 2, // 罫線上に配置
            top: item.y * cellSize,
            width: 4, // 仕切りの太さ
            height: item.height * cellSize,
          }}
          onContextMenu={onContextMenu}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div className="w-full h-full bg-[var(--color-indigo)] rounded-sm relative">
            {item.isLocked && (
              <div className="absolute top-0 -right-3 bg-white rounded-full p-1">
                <Lock className="h-3 w-3 text-[var(--color-indigo)]" />
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  // 通常のアイテム（和菓子または従来の仕切り）のreturn部分で、transformOriginを修正
  return (
    <div
      ref={(node) => {
        elementRef.current = node
        drag(node)
      }}
      data-testid="placed-item"
      className={`absolute cursor-move placed-item ${isDragging ? "opacity-50" : "opacity-100"} ${
        item.isLocked ? "cursor-not-allowed" : ""
      } ${isAnimating ? "z-30" : ""} ${isNew ? "placed-item-enter placed-item-enter-active" : ""}`}
      style={{
        left: item.x * cellSize,
        top: item.y * cellSize,
        width: item.width * cellSize,
        height: item.height * cellSize,
        zIndex: item.type === "divider" ? 25 : 20, // 仕切りのzIndexを和菓子よりも高く設定
      }}
      onContextMenu={onContextMenu}
      onDoubleClick={() => item.type === "sweet" && onDoubleClick && onDoubleClick(item)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {item.type === "sweet" ? (
        <div className="relative w-full h-full border border-[var(--color-indigo-light)] bg-white rounded-sm overflow-hidden">
          <img
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.name}
            className="w-full h-full"
            style={{
              objectFit: "contain",
              transform: item.rotation ? `rotate(${item.rotation}deg)` : "none",
              transformOrigin: "center center",
            }}
          />
          {item.isLocked && (
            <div className="absolute top-1 right-1 bg-white rounded-full p-1">
              <Lock className="h-4 w-4 text-[var(--color-indigo)]" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          <div
            className={`bg-[var(--color-indigo)] ${item.orientation === "horizontal" ? "w-full h-1" : "w-1 h-full"} absolute`}
          ></div>
          {item.isLocked && (
            <div className="absolute top-0 right-0 bg-white rounded-full p-1">
              <Lock className="h-3 w-3 text-[var(--color-indigo)]" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
