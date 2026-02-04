"use client"

import { useDragLayer } from "react-dnd"
import { useEffect, useState } from "react"
import type { PlacedItem } from "@/types/types"

interface DragLayerProps {
  gridSize: { width: number; height: number }
  placedItems: PlacedItem[]
}

export default function DragLayer({ gridSize, placedItems }: DragLayerProps) {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }))

  // ドラッグ中のアイテムの最新情報を保持するための状態
  const [draggedItem, setDraggedItem] = useState<any>(null)

  // ドラッグ中のアイテムが配置済みアイテムの場合、最新の情報を取得
  useEffect(() => {
    if (isDragging && item && "id" in item && item.type === "placedItem") {
      const placedItem = placedItems.find((p) => p.id === item.id)
      if (placedItem) {
        setDraggedItem({
          ...item,
          width: placedItem.width,
          height: placedItem.height,
          orientation: placedItem.orientation,
          rotation: placedItem.rotation, // 回転情報を追加
        })
      } else {
        setDraggedItem(item)
      }
    } else if (isDragging && item) {
      setDraggedItem(item)
    } else {
      setDraggedItem(null)
    }
  }, [isDragging, item, placedItems])

  if (!isDragging || !currentOffset || !draggedItem) {
    return null
  }

  // ドラッグ中のアイテムの情報を取得
  const width = "width" in draggedItem ? draggedItem.width : 1
  const height = "height" in draggedItem ? draggedItem.height : 1
  const type = "type" in draggedItem ? draggedItem.type : "unknown"
  const isGridLine = "isGridLine" in draggedItem ? draggedItem.isGridLine : false
  const orientation =
    "orientation" in draggedItem
      ? draggedItem.orientation
      : draggedItem.item && "orientation" in draggedItem.item
        ? draggedItem.item.orientation
        : null

  // プレビューのスタイルを設定
  let previewStyle = {}
  const rotation = "rotation" in draggedItem ? draggedItem.rotation : 0

  if (isGridLine && orientation) {
    // グリッドライン上の仕切りの場合
    if (orientation === "horizontal") {
      previewStyle = {
        width: width * 40,
        height: 4,
      }
    } else {
      previewStyle = {
        width: 4,
        height: height * 40,
      }
    }
  } else {
    // 通常のアイテムの場合
    previewStyle = {
      width: width * 40,
      height: height * 40,
      transform: rotation ? `rotate(${rotation}deg)` : "none", // 回転を適用
      transformOrigin: "center center", // 回転の中心を設定
    }
  }

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: currentOffset.x,
        top: currentOffset.y,
        opacity: 0.7,
      }}
    >
      {type === "sweet" && (
        <div className="border-2 border-dashed border-amber-500 bg-amber-100" style={previewStyle}></div>
      )}
      {type === "divider" && !isGridLine && (
        <div
          className={`bg-amber-800 ${
            draggedItem.item && "orientation" in draggedItem.item && draggedItem.item.orientation === "horizontal"
              ? "w-full h-1"
              : "w-1 h-full"
          }`}
          style={previewStyle}
        ></div>
      )}
      {type === "divider" && isGridLine && <div className="bg-amber-800 rounded-sm" style={previewStyle}></div>}
    </div>
  )
}