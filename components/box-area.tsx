"use client"

import type React from "react"

// 既存のインポート
import { useState, useRef, useEffect, useCallback } from "react"
import { flushSync } from "react-dom"
import { useDrop } from "react-dnd"
import type { BoxSize, PlacedItem, DragItem, SweetItem } from "@/types/types"
import PlacedItemComponent from "./placed-item"
import ContextMenu from "./context-menu"
import DividerResizeModal from "./divider-resize-modal"
import ImageViewerModal from "./image-viewer-modal"
import { generateId } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { InfoDisplaySettings } from "@/components/info-settings-modal"

import ErrorModalComponent from "./error-modal"
import { fetchSweets } from "@/services/api-service"

// BoxAreaProps インターフェース
interface BoxAreaProps {
  boxSize: BoxSize
  placedItems: PlacedItem[]
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItem[]>>
  infoSettings: InfoDisplaySettings
  contextMenuRef?: React.RefObject<HTMLDivElement>
  productInfoRef?: React.RefObject<HTMLDivElement>
  selectedStoreId: string
}

// BoxArea 関数
export default function BoxArea({
  boxSize,
  placedItems,
  setPlacedItems,
  infoSettings,
  contextMenuRef,
  productInfoRef,
  selectedStoreId,
}: BoxAreaProps) {
  // 既存のステート定義は省略...
  const [gridSize, setGridSize] = useState({ width: 10, height: 10 })
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    item: PlacedItem | null
  }>({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  })

  // sweetsデータを状態として管理
  const [sweets, setSweets] = useState<SweetItem[]>([])



  // 仕切り長さ調整用の状態
  const [resizingDivider, setResizingDivider] = useState<PlacedItem | null>(null)

  // 表示上の最大サイズを定義（cm単位の箱サイズに基づいて計算）
  const getMaxDisplaySize = () => {
    if (typeof window !== 'undefined') {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // デスクトップ（lg以上）
      if (viewportWidth >= 1024) {
        return {
          maxWidth: 720,
          maxHeight: 600,
        }
      }
      // タブレット（md以上）
      else if (viewportWidth >= 768) {
        return {
          maxWidth: 450,
          maxHeight: 400,
        }
      }
      // モバイル
      else {
        return {
          maxWidth: 350,
          maxHeight: 300,
        }
      }
    }
    return { maxWidth: 600, maxHeight: 500 } // サーバーサイドレンダリング時のデフォルト
  }
  
  const [maxDisplaySize, setMaxDisplaySize] = useState(getMaxDisplaySize())
  
  // ウィンドウリサイズ時にサイズを更新
  useEffect(() => {
    const handleResize = () => {
      setMaxDisplaySize(getMaxDisplaySize())
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // セルサイズを動的に計算（幅と高さの制約を考慮）
  const calculateCellSize = useCallback(() => {
    console.log("calculateCellSize called with gridSize:", gridSize, "maxDisplaySize:", maxDisplaySize)
    
    // 最大表示サイズ内に収まるようにセルサイズを計算
    let cellSizeByWidth = (maxDisplaySize.maxWidth / gridSize.width)
    let cellSizeByHeight = (maxDisplaySize.maxHeight / gridSize.height)
    
    // 両方の制約を満たすセルサイズを選択（より小さい方）
    const cellSize = Math.min(cellSizeByWidth, cellSizeByHeight)
    const finalCellSize = Math.max(cellSize, 1) // 最小セルサイズは1px
    
    console.log("cellSizeByWidth:", cellSizeByWidth, "cellSizeByHeight:", cellSizeByHeight, "finalCellSize:", finalCellSize)
    
    return finalCellSize
  }, [gridSize, maxDisplaySize])
  
  const cellSize = calculateCellSize()

  // 新しく追加されたアイテムのIDを追跡
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set())

  // ドラッグ中のアイテムのプレビュー位置を追跡
  const [previewPosition, setPreviewPosition] = useState<{
    x: number
    y: number
    width: number
    height: number
    isValid: boolean
    visible: boolean
    isGridLine?: boolean
    orientation?: "horizontal" | "vertical"
    isSnapped?: boolean // スナップされているかどうかのフラグを追加
  }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    isValid: false,
    visible: false,
  })

  // BoxAreaコンポーネントの状態に商品情報モーダル用の状態を追加
  const [infoModalItem, setInfoModalItem] = useState<PlacedItem | null>(null)

  // 画像拡大表示用の状態を追加
  const [imageViewerItem, setImageViewerItem] = useState<PlacedItem | null>(null)

  // エラーモーダル用の状態
  const [errorModal, setErrorModal] = useState<{
    visible: boolean
    title: string
    message: string
  }>({
    visible: false,
    title: "",
    message: "",
  })

  // スナップ機能の閾値（セル単位）
  const snapThreshold = 0.3

  const boxRef = useRef<HTMLDivElement>(null)

  // sweetsデータを取得
  useEffect(() => {
    const loadSweets = async () => {
      try {
        const sweetsData = await fetchSweets(selectedStoreId)
        setSweets(sweetsData)
      } catch (error) {
        console.error("Failed to load sweets:", error)
        // エラー時は空の配列を設定
        setSweets([])
      }
    }
    loadSweets()
  }, [selectedStoreId])

  useEffect(() => {
    // 箱サイズの設定（cm単位）
    // 例: "22x22" (cm) -> width: 220, height: 220 (グリッドマス単位で1グリッド=1mm)
    const [width, height] = boxSize.split("x").map(Number)
    // 10倍して、より細かいグリッド（1グリッド = 1mm）にする
    const newGridSize = { width: width * 10, height: height * 10 }
    setGridSize(newGridSize)
  }, [boxSize])

  // 削除された商品をチェックする関数
  const checkDeletedItems = useCallback(async () => {
    try {
      const sweetsData = await fetchSweets(selectedStoreId)
      setSweets(sweetsData)

      // 削除された商品が配置されているかチェック
      const deletedItems = placedItems.filter(placedItem => {
        if (placedItem.type === 'sweet') {
          return !sweetsData.find(sweet => sweet.id === placedItem.itemId)
        }
        return false
      })

      if (deletedItems.length > 0) {
        // 削除された商品を配置済みアイテムから削除
        setPlacedItems(prev => prev.filter(item =>
          !deletedItems.some(deleted => deleted.id === item.id)
        ))

        // エラーモーダルで削除された商品を通知
        setErrorModal({
          visible: true,
          title: "商品が削除されました",
          message: `${deletedItems.length}個の商品が管理画面で削除されたため、配置から削除されました。`
        })
      }
    } catch (error) {
      console.error("Failed to load sweets:", error)
      // エラー時は空の配列を設定
      setSweets([])
    }
  }, [placedItems, setPlacedItems, selectedStoreId])



  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ["sweet", "divider", "placedItem"],
      hover: (
        item:
          | DragItem
          | {
            id: string
            type: "placedItem"
            width?: number
            height?: number
            isGridLine?: boolean
            orientation?: string
            offsetX?: number
            offsetY?: number
          },
        monitor,
      ) => {
        const boxRect = boxRef.current?.getBoundingClientRect()
        if (!boxRect) return

        const clientOffset = monitor.getClientOffset()
        if (!clientOffset) return

        // オフセットを取得（ドラッグ要素内でのクリック位置）
        const offsetX = "offsetX" in item ? item.offsetX || 0 : 0
        const offsetY = "offsetY" in item ? item.offsetY || 0 : 0

        // ホバー位置の計算（オフセットを考慮）
        let x = Math.floor((clientOffset.x - boxRect.left - offsetX) / cellSize)
        let y = Math.floor((clientOffset.y - boxRect.top - offsetY) / cellSize)

        // グリッド範囲内に収める
        x = Math.max(0, x)
        y = Math.max(0, y)

        // グリッドライン上の仕切りの場合
        if (
          ("isGridLine" in item && item.isGridLine) ||
          ("type" in item && item.type === "divider" && "isGridLine" in item && item.isGridLine)
        ) {
          // グリッドライン上の位置を計算
          const orientation =
            "item" in item && item.item && "orientation" in item.item
              ? item.item.orientation
              : "orientation" in item
                ? (item.orientation as "horizontal" | "vertical")
                : "horizontal"

          if (orientation === "horizontal") {
            // 水平仕切りの場合、行間に配置
            y = Math.round((clientOffset.y - boxRect.top - offsetY) / cellSize)

            // スナップ位置を計算
            const snapPosition = findHorizontalSnapPosition(
              x,
              y,
              item.width || 1,
              "type" in item && item.type === "placedItem" ? item.id : undefined,
            )

            // スナップ位置が見つかった場合
            if (snapPosition) {
              y = snapPosition.y

              // 配置可能かチェック
              const isValidPlacement = checkValidGridLinePlacement(
                x,
                y,
                item.width || 1,
                "horizontal",
                "type" in item && item.type === "placedItem" ? item.id : undefined,
              )

              const isValidIntersection = checkDividerSweetIntersection(
                x,
                y,
                "horizontal",
                item.width || 1,
                "type" in item && item.type === "placedItem" ? item.id : undefined,
              )

              setPreviewPosition({
                x,
                y,
                width: item.width || 1,
                height: 0, // 高さは実質0（線）
                isValid: isValidPlacement && isValidIntersection,
                visible: true,
                isGridLine: true,
                orientation: "horizontal",
                isSnapped: true,
              })
              return
            }

            // 通常の配置可能性チェック
            const isValidPlacement = checkValidGridLinePlacement(
              x,
              y,
              item.width || 1,
              "horizontal",
              "type" in item && item.type === "placedItem" ? item.id : undefined,
            )

            const isValidIntersection = checkDividerSweetIntersection(
              x,
              y,
              "horizontal",
              item.width || 1,
              "type" in item && item.type === "placedItem" ? item.id : undefined,
            )

            setPreviewPosition({
              x,
              y,
              width: item.width || 1,
              height: 0, // 高さは実質0（線）
              isValid: isValidPlacement && isValidIntersection,
              visible: true,
              isGridLine: true,
              orientation: "horizontal",
              isSnapped: false,
            })
          } else {
            // 垂直仕切りの場合、列間に配置
            x = Math.round((clientOffset.x - boxRect.left - offsetX) / cellSize)

            // スナップ位置を計算
            const snapPosition = findVerticalSnapPosition(
              x,
              y,
              item.height || 1,
              "type" in item && item.type === "placedItem" ? item.id : undefined,
            )

            // スナップ位置が見つかった場合
            if (snapPosition) {
              x = snapPosition.x

              // 配置可能かチェック
              const isValidPlacement = checkValidGridLinePlacement(
                x,
                y,
                item.height || 1,
                "vertical",
                "type" in item && item.type === "placedItem" ? item.id : undefined,
              )

              const isValidIntersection = checkDividerSweetIntersection(
                x,
                y,
                "vertical",
                item.height || 1,
                "type" in item && item.type === "placedItem" ? item.id : undefined,
              )

              setPreviewPosition({
                x,
                y,
                width: 0, // 幅は実質0（線）
                height: item.height || 1,
                isValid: isValidPlacement && isValidIntersection,
                visible: true,
                isGridLine: true,
                orientation: "vertical",
                isSnapped: true,
              })
              return
            }

            // 通常の配置可能性チェック
            const isValidPlacement = checkValidGridLinePlacement(
              x,
              y,
              item.height || 1,
              "vertical",
              "type" in item && item.type === "placedItem" ? item.id : undefined,
            )

            const isValidIntersection = checkDividerSweetIntersection(
              x,
              y,
              "vertical",
              item.height || 1,
              "type" in item && item.type === "placedItem" ? item.id : undefined,
            )

            setPreviewPosition({
              x,
              y,
              width: 0, // 幅は実質0（線）
              height: item.height || 1,
              isValid: isValidPlacement && isValidIntersection,
              visible: true,
              isGridLine: true,
              orientation: "vertical",
              isSnapped: false,
            })
          }
          return
        }

        // 通常のアイテム（和菓子または従来の仕切り）の場合
        // placedItemの場合
        if ("type" in item && item.type === "placedItem") {
          // ドラッグ開始時の幅と高さを使用（回転後の値）
          const itemWidth = "width" in item ? item.width : 1
          const itemHeight = "height" in item ? item.height : 1

          // 配置可能かチェック
          const isValid = checkValidPlacement(x, y, itemWidth, itemHeight, item.id)

          setPreviewPosition({
            x,
            y,
            width: itemWidth,
            height: itemHeight,
            isValid,
            visible: true,
          })
          return
        }

        // 新規アイテムの場合
        if ("width" in item && "height" in item) {
          // 配置可能かチェック
          const isValid = checkValidPlacement(x, y, item.width, item.height)

          setPreviewPosition({
            x,
            y,
            width: item.width,
            height: item.height,
            isValid,
            visible: true,
          })
        }
      },
      drop: (
        item:
          | DragItem
          | {
            id: string
            type: "placedItem"
            width?: number
            height?: number
            isGridLine?: boolean
            orientation?: string
            offsetX?: number
            offsetY?: number
          },
        monitor,
      ) => {
        const boxRect = boxRef.current?.getBoundingClientRect()
        if (!boxRect) return

        const clientOffset = monitor.getClientOffset()
        if (!clientOffset) return

        // オフセットを取得（ドラッグ要素内でのクリック位置）
        const offsetX = "offsetX" in item ? item.offsetX || 0 : 0
        const offsetY = "offsetY" in item ? item.offsetY || 0 : 0

        // ドロップ位置の計算（オフセットを考慮）
        let x = Math.floor((clientOffset.x - boxRect.left - offsetX) / cellSize)
        let y = Math.floor((clientOffset.y - boxRect.top - offsetY) / cellSize)

        // グリッド範囲内に収める
        x = Math.max(0, x)
        y = Math.max(0, y)

        // グリッドライン上の仕切りの場合
        if (
          ("isGridLine" in item && item.isGridLine) ||
          ("type" in item && item.type === "divider" && "isGridLine" in item && item.isGridLine)
        ) {
          const orientation =
            "item" in item && item.item && "orientation" in item.item
              ? item.item.orientation
              : "orientation" in item
                ? (item.orientation as "horizontal" | "vertical")
                : "horizontal"

          // プレビュー位置がスナップされている場合、その位置を使用
          if (previewPosition.isSnapped) {
            x = previewPosition.x
            y = previewPosition.y
          } else {
            if (orientation === "horizontal") {
              // 水平仕切りの場合、行間に配置
              y = Math.round((clientOffset.y - boxRect.top - offsetY) / cellSize)

              // スナップ位置を確認
              const snapPosition = findHorizontalSnapPosition(
                x,
                y,
                item.width || 1,
                "type" in item && item.type === "placedItem" ? item.id : undefined,
              )
              if (snapPosition) {
                y = snapPosition.y
              }
            } else {
              // 垂直仕切りの場合、列間に配置
              x = Math.round((clientOffset.x - boxRect.left - offsetX) / cellSize)

              // スナップ位置を確認
              const snapPosition = findVerticalSnapPosition(
                x,
                y,
                item.height || 1,
                "type" in item && item.type === "placedItem" ? item.id : undefined,
              )
              if (snapPosition) {
                x = snapPosition.x
              }
            }
          }

          // 配置可能かチェック
          if (orientation === "horizontal") {
            if (
              !checkValidGridLinePlacement(
                x,
                y,
                item.width || 1,
                "horizontal",
                "type" in item && item.type === "placedItem" ? item.id : undefined,
              ) ||
              !checkDividerSweetIntersection(
                x,
                y,
                "horizontal",
                item.width || 1,
                "type" in item && item.type === "placedItem" ? item.id : undefined,
              )
            ) {
              setPreviewPosition((prev) => ({ ...prev, visible: false }))
              return
            }
          } else {
            if (
              !checkValidGridLinePlacement(
                x,
                y,
                item.height || 1,
                "vertical",
                "type" in item && item.type === "placedItem" ? item.id : undefined,
              ) ||
              !checkDividerSweetIntersection(
                x,
                y,
                "vertical",
                item.height || 1,
                "type" in item && item.type === "placedItem" ? item.id : undefined,
              )
            ) {
              setPreviewPosition((prev) => ({ ...prev, visible: false }))
              return
            }
          }

          // placedItem の場合は移動処理
          if ("type" in item && item.type === "placedItem") {
            setPlacedItems((prev) =>
              prev.map((placedItem) => (placedItem.id === item.id ? { ...placedItem, x, y } : placedItem)),
            )
            setPreviewPosition((prev) => ({ ...prev, visible: false }))
            return
          }

          // 新しい仕切りを追加
          const newItemId = generateId()
          const newItem: PlacedItem = {
            id: newItemId,
            itemId: "item" in item ? item.id : "",
            type: "divider",
            x,
            y,
            width: orientation === "horizontal" ? item.width || 1 : 0,
            height: orientation === "vertical" ? item.height || 1 : 0,
            rotation: 0,
            isLocked: false,
            imageUrl: "item" in item && item.item ? item.item.imageUrl : "",
            name: "item" in item && item.item ? item.item.name : "仕切り",
            orientation,
            isGridLine: true,
          }

          // 新しいアイテムのIDを追跡
          setNewItemIds((prev) => new Set(prev).add(newItemId))
          setTimeout(() => {
            setNewItemIds((prev) => {
              const updated = new Set(prev)
              updated.delete(newItemId)
              return updated
            })
          }, 500)

          setPlacedItems((prev) => [...prev, newItem])
          setPreviewPosition((prev) => ({ ...prev, visible: false }))
          return
        }

        // 通常のアイテム（和菓子）の場合
        // placedItem の場合は移動処理
        if ("type" in item && item.type === "placedItem") {
          // ドラッグ開始時の幅と高さを使用（回転後の値）
          const itemWidth = "width" in item ? item.width : 1
          const itemHeight = "height" in item ? item.height : 1

          // 配置可能かチェック（回転も考慮）
          if (!checkValidPlacement(x, y, itemWidth, itemHeight, item.id)) {
            return
          }

          setPlacedItems((prev) =>
            prev.map((placedItem) => (placedItem.id === item.id ? { ...placedItem, x, y } : placedItem)),
          )
          setPreviewPosition((prev) => ({ ...prev, visible: false }))
          return
        }

        // 以下は既存のコード（新規アイテムの配置処理）
        // 配置可能かチェック
        if (!("width" in item) || !("height" in item) || !checkValidPlacement(x, y, item.width, item.height)) {
          setPreviewPosition((prev) => ({ ...prev, visible: false }))
          return
        }

        // 新しいアイテムのIDを生成
        const newItemId = generateId()

        // 新しいアイテムを追加
        const newItem: PlacedItem = {
          id: newItemId,
          itemId: item.id,
          type: item.type as "sweet" | "divider",
          x,
          y,
          width: item.width,
          height: item.height,
          rotation: 0,
          isLocked: false,
          imageUrl: item.item?.placedImageUrl || item.item?.imageUrl || "",
          name: item.item?.name || "",
          price: "item" in item && item.item && "price" in item.item ? item.item.price : undefined,
          orientation: "item" in item && item.item && "orientation" in item.item ? item.item.orientation : undefined,
        }

        // 新しいアイテムのIDを追跡
        setNewItemIds((prev) => new Set(prev).add(newItemId))

        // 一定時間後に新しいアイテムのフラグをクリア
        setTimeout(() => {
          setNewItemIds((prev) => {
            const updated = new Set(prev)
            updated.delete(newItemId)
            return updated
          })
        }, 500)

        setPlacedItems((prev) => [...prev, newItem])
        setPreviewPosition((prev) => ({ ...prev, visible: false }))
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [gridSize, newItemIds, previewPosition.isSnapped, placedItems],
  )

  // ドラッグが終了したらプレビューを非表示にする
  useEffect(() => {
    if (!isOver) {
      setPreviewPosition((prev) => ({ ...prev, visible: false }))
    }
  }, [isOver])

  // 水平仕切りのスナップ位置を見つける関数
  const findHorizontalSnapPosition = useCallback((x: number, y: number, length: number, excludeId?: string) => {
    // 和菓子のみをフィルタリング
    const sweets = placedItems.filter((item) => item.type === "sweet" && (excludeId ? item.id !== excludeId : true))

    // スナップ候補位置
    const snapCandidates: { y: number; distance: number }[] = []

    // 各和菓子の上端と下端をスナップ候補として追加
    sweets.forEach((sweet) => {
      const topEdge = sweet.y
      const bottomEdge = sweet.y + sweet.height

      // 仕切りの範囲と和菓子の水平範囲が重なるかチェック
      const dividerLeft = x
      const dividerRight = x + length
      const sweetLeft = sweet.x
      const sweetRight = sweet.x + sweet.width

      // 水平方向の重なりがある場合のみスナップ候補に追加
      if (!(dividerRight <= sweetLeft || dividerLeft >= sweetRight)) {
        // 上端へのスナップ
        const topDistance = Math.abs(y - topEdge)
        if (topDistance <= snapThreshold) {
          snapCandidates.push({ y: topEdge, distance: topDistance })
        }

        // 下端へのスナップ
        const bottomDistance = Math.abs(y - bottomEdge)
        if (bottomDistance <= snapThreshold) {
          snapCandidates.push({ y: bottomEdge, distance: bottomDistance })
        }
      }
    })

    // 最も近いスナップ位置を返す
    if (snapCandidates.length > 0) {
      snapCandidates.sort((a, b) => a.distance - b.distance)
      return snapCandidates[0]
    }

    return null
  }, [placedItems, snapThreshold])

  // 垂直仕切りのスナップ位置を見つける関数
  const findVerticalSnapPosition = useCallback((x: number, y: number, length: number, excludeId?: string) => {
    // 和菓子のみをフィルタリング
    const sweets = placedItems.filter((item) => item.type === "sweet" && (excludeId ? item.id !== excludeId : true))

    // スナップ候補位置
    const snapCandidates: { x: number; distance: number }[] = []

    // 各和菓子の左端と右端をスナップ候補として追加
    sweets.forEach((sweet) => {
      const leftEdge = sweet.x
      const rightEdge = sweet.x + sweet.width

      // 仕切りの範囲と和菓子の垂直範囲が重なるかチェック
      const dividerTop = y
      const dividerBottom = y + length
      const sweetTop = sweet.y
      const sweetBottom = sweet.y + sweet.height

      // 垂直方向の重なりがある場合のみスナップ候補に追加
      if (!(dividerBottom <= sweetTop || dividerTop >= sweetBottom)) {
        // 左端へのスナップ
        const leftDistance = Math.abs(x - leftEdge)
        if (leftDistance <= snapThreshold) {
          snapCandidates.push({ x: leftEdge, distance: leftDistance })
        }

        // 右端へのスナップ
        const rightDistance = Math.abs(x - rightEdge)
        if (rightDistance <= snapThreshold) {
          snapCandidates.push({ x: rightEdge, distance: rightDistance })
        }
      }
    })

    // 最も近いスナップ位置を返す
    if (snapCandidates.length > 0) {
      snapCandidates.sort((a, b) => a.distance - b.distance)
      return snapCandidates[0]
    }

    return null
  }, [placedItems, snapThreshold])

  // グリッドライン上の仕切りの配置可能性をチェックする関数
  const checkValidGridLinePlacement = useCallback((
    x: number,
    y: number,
    length: number,
    orientation: "horizontal" | "vertical",
    excludeId?: string,
  ) => {
    // グリッド外への配置をチェック
    if (orientation === "horizontal") {
      // 水平仕切りの場合
      if (x < 0 || y < 0 || y > gridSize.height || x + length > gridSize.width) {
        return false
      }
    } else {
      // 垂直仕切りの場合
      if (x < 0 || y < 0 || x > gridSize.width || y + length > gridSize.height) {
        return false
      }
    }

    // 既存の仕切りとの重複チェック
    const isOverlapping = placedItems.some((placedItem) => {
      // 自分自身との重複はチェックしない
      if (excludeId && placedItem.id === excludeId) {
        return false
      }

      if (placedItem.type !== "divider" || !placedItem.isGridLine) {
        return false
      }

      if (placedItem.orientation === orientation) {
        // 同じ向きの仕切り同士
        if (orientation === "horizontal") {
          // 水平仕切り
          if (placedItem.y === y) {
            // 同じ行にある場合、X方向の重なりをチェック
            const itemRight = placedItem.x + placedItem.width
            const newItemRight = x + length
            return !(itemRight <= x || placedItem.x >= newItemRight)
          }
        } else {
          // 垂直仕切り
          if (placedItem.x === x) {
            // 同じ列にある場合、Y方向の重なりをチェック
            const itemBottom = placedItem.y + placedItem.height
            const newItemBottom = y + length
            return !(itemBottom <= y || placedItem.y >= newItemBottom)
          }
        }
      }
      return false
    })

    return !isOverlapping
  }, [placedItems, gridSize])

  // 配置可能かどうかをチェックする関数
  const checkValidPlacement = useCallback((x: number, y: number, width: number, height: number, excludeId?: string) => {
    // グリッド外への配置をチェック
    if (x < 0 || y < 0 || x + width > gridSize.width || y + height > gridSize.height) {
      return false
    }

    // 他のアイテムとの重複チェック
    const isOverlapping = placedItems.some((placedItem) => {
      // 自分自身との重複はチェックしない
      if (excludeId && placedItem.id === excludeId) {
        return false
      }

      // グリッドライン上の仕切りはここではチェックしない
      if (placedItem.type === "divider" && placedItem.isGridLine) {
        return false
      }

      // 通常のアイテム同士の重複チェック（仕切り以外）
      if (placedItem.type !== "divider") {
        const itemRight = placedItem.x + placedItem.width
        const itemBottom = placedItem.y + placedItem.height
        const newItemRight = x + width
        const newItemBottom = y + height

        return !(itemRight <= x || placedItem.x >= newItemRight || itemBottom <= y || placedItem.y >= newItemBottom)
      }

      return false
    })

    if (isOverlapping) {
      return false
    }

    // グリッドライン上の仕切りとの交差チェック
    const gridLineDividers = placedItems.filter((item) => item.type === "divider" && item.isGridLine)

    // 和菓子の領域を表す矩形
    const sweetRect = {
      left: x,
      right: x + width,
      top: y,
      bottom: y + height,
    }

    // 仕切りとの交差をチェック
    for (const divider of gridLineDividers) {
      if (divider.orientation === "horizontal") {
        // 水平仕切りの場合
        const dividerY = divider.y
        const dividerLeft = divider.x
        const dividerRight = divider.x + divider.width

        // 和菓子が仕切りをまたいでいるかチェック
        if (sweetRect.top < dividerY && sweetRect.bottom > dividerY) {
          // 水平方向の重なりをチェック
          if (
            (sweetRect.left >= dividerLeft && sweetRect.left < dividerRight) ||
            (sweetRect.right > dividerLeft && sweetRect.right <= dividerRight) ||
            (sweetRect.left <= dividerLeft && sweetRect.right >= dividerRight)
          ) {
            return false
          }
        }
      } else {
        // 垂直仕切りの場合
        const dividerX = divider.x
        const dividerTop = divider.y
        const dividerBottom = divider.y + divider.height

        // 和菓子が仕切りをまたいでいるかチェック
        if (sweetRect.left < dividerX && sweetRect.right > dividerX) {
          // 垂直方向の重なりをチェック
          if (
            (sweetRect.top >= dividerTop && sweetRect.top < dividerBottom) ||
            (sweetRect.bottom > dividerTop && sweetRect.bottom <= dividerBottom) ||
            (sweetRect.top <= dividerTop && sweetRect.bottom >= dividerBottom)
          ) {
            return false
          }
        }
      }
    }

    return true
  }, [placedItems, gridSize])

  // 仕切りの長さ調整が可能かチェックする関数
  const checkValidDividerResize = (divider: PlacedItem, newLength: number) => {
    if (divider.orientation === "horizontal") {
      // 水平仕切りの場合
      if (divider.x + newLength > gridSize.width) {
        return false
      }

      // 他の仕切りとの重複チェック
      return checkValidGridLinePlacement(divider.x, divider.y, newLength, "horizontal", divider.id)
    } else {
      // 垂直仕切りの場合
      if (divider.y + newLength > gridSize.height) {
        return false
      }

      // 他の仕切りとの重複チェック
      return checkValidGridLinePlacement(divider.x, divider.y, newLength, "vertical", divider.id)
    }
  }

  // 仕切りとお菓子の交差をチェックする関数
  const checkDividerSweetIntersection = useCallback((
    x: number,
    y: number,
    orientation: "horizontal" | "vertical",
    length: number,
    excludeId?: string,
  ) => {
    // お菓子のみをフィルタリング
    const sweets = placedItems.filter((item) => item.type === "sweet")

    // 仕切りの領域を定義
    const dividerRect = {
      left: x,
      right: orientation === "horizontal" ? x + length : x,
      top: y,
      bottom: orientation === "vertical" ? y + length : y,
    }

    // お菓子との交差をチェック
    for (const sweet of sweets) {
      const sweetRect = {
        left: sweet.x,
        right: sweet.x + sweet.width,
        top: sweet.y,
        bottom: sweet.y + sweet.height,
      }

      if (orientation === "horizontal") {
        // 水平仕切りの場合
        // お菓子が仕切りをまたいでいるかチェック - 接触は許可する
        if (sweetRect.top < y && sweetRect.bottom > y) {
          // 水平方向の重なりをチェック
          if (
            (sweetRect.left < dividerRect.right && sweetRect.right > dividerRect.left) ||
            (sweetRect.left < dividerRect.right && sweetRect.right > dividerRect.left) ||
            (sweetRect.left < dividerRect.left && sweetRect.right > dividerRect.right)
          ) {
            return false
          }
        }

        // 接触のケースを許可する（お菓子の下端が仕切りの上端に接触、または上端が仕切りの下端に接触）
        if (
          (sweetRect.bottom === y || sweetRect.top === y + 1) &&
          !(sweetRect.right <= dividerRect.left || sweetRect.left >= dividerRect.right)
        ) {
          // 接触は許可するので、falseを返さない
          continue
        }
      } else {
        // 垂直仕切りの場合
        // お菓子が仕切りをまたいでいるかチェック - 接触は許可する
        if (sweetRect.left < x && sweetRect.right > x) {
          // 垂直方向の重なりをチェック
          if (
            (sweetRect.top < dividerRect.bottom && sweetRect.bottom > dividerRect.top) ||
            (sweetRect.top < dividerRect.bottom && sweetRect.bottom > dividerRect.top) ||
            (sweetRect.top < dividerRect.top && sweetRect.bottom > dividerRect.bottom)
          ) {
            return false
          }
        }

        // 接触のケースを許可する（お菓子の右端が仕切りの左端に接触、または左端が仕切りの右端に接触）
        if (
          (sweetRect.right === x || sweetRect.left === x + 1) &&
          !(sweetRect.bottom <= dividerRect.top || sweetRect.top >= dividerRect.bottom)
        ) {
          // 接触は許可するので、falseを返さない
          continue
        }
      }
    }

    return true
  }, [placedItems])

  // 仕切りの長さを調整する関数
  const handleResizeDivider = (id: string, newLength: number) => {
    const divider = placedItems.find((item) => item.id === id)
    if (!divider || divider.type !== "divider") return

    // 長さ調整が可能かチェック
    if (!checkValidDividerResize(divider, newLength)) {
      alert("この長さに調整できません。他のアイテムと重なるか、グリッド外になります。")
      return
    }

    // 仕切りの長さを更新
    setPlacedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.orientation === "horizontal") {
            return { ...item, width: newLength }
          } else {
            return { ...item, height: newLength }
          }
        }
        return item
      }),
    )
  }

  // 合計金額を計算する関数
  const calculateTotalPrice = () => {
    return placedItems
      .filter((item) => item.type === "sweet" && item.price)
      .reduce((total, item) => total + (item.price || 0), 0)
  }

  const handleContextMenu = (e: React.MouseEvent, item: PlacedItem) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item,
    })
  }

  // handleContextMenuの定義の近くに以下の関数を追加

  const handleShowItemInfo = (item: PlacedItem) => {
    setInfoModalItem(item)
    handleCloseContextMenu()
  }

  // 画像拡大表示用の関数を追加
  const handleShowImageViewer = (item: PlacedItem) => {
    setImageViewerItem(item)
  }

  const handleCloseContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }

  const handleDeleteItem = (id: string) => {
    // 同期的に削除を実行
    flushSync(() => {
      setPlacedItems((prev) => prev.filter((item) => item.id !== id))
    })

    // プレビュー位置をリセット
    flushSync(() => {
      setPreviewPosition({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        isValid: false,
        visible: false,
      })
    })

    // コンテキストメニューを閉じる
    handleCloseContextMenu()

    // 強制的に再レンダリングを促すため、少し遅延させてダミー更新
    setTimeout(() => {
      setPreviewPosition(prev => ({ ...prev }))
    }, 0)
  }

  const handleToggleLock = (id: string) => {
    setPlacedItems((prev) => prev.map((item) => (item.id === id ? { ...item, isLocked: !item.isLocked } : item)))
    handleCloseContextMenu()
  }

  const handleRotateItem = (id: string) => {
    setPlacedItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.type === "sweet") {
          // 幅と高さを入れ替えて回転を表現
          const newWidth = item.height
          const newHeight = item.width

          // グリッド範囲外にはみ出さないか確認
          if (item.x + newWidth > gridSize.width || item.y + newHeight > gridSize.height) {
            // エラーモーダルを表示
            setErrorModal({
              visible: true,
              title: "回転エラー",
              message: "回転すると箱の外にはみ出してしまいます。位置を調整してから回転してください。",
            })
            // 元の状態を維持
            return item
          }

          // 他のアイテムとの衝突をチェック
          const wouldCollide = placedItems.some((otherItem) => {
            // 自分自身とは衝突判定しない
            if (otherItem.id === id) return false



            // グリッドライン上の仕切りは無視
            if (otherItem.type === "divider" && otherItem.isGridLine) return false

            // 通常の衝突判定
            const itemRight = item.x + newWidth
            const itemBottom = item.y + newHeight
            const otherRight = otherItem.x + otherItem.width
            const otherBottom = otherItem.y + otherItem.height

            return !(
              itemRight <= otherItem.x ||
              item.x >= otherRight ||
              itemBottom <= otherItem.y ||
              item.y >= otherBottom
            )
          })

          if (wouldCollide) {
            // エラーモーダルを表示
            setErrorModal({
              visible: true,
              title: "回転エラー",
              message: "回転すると他の商品と重なってしまいます。位置を調整してから回転してください。",
            })
            // 元の状態を維持
            return item
          }

          // 全てのチェックをパスしたら回転を適用（幅と高さを入れ替え）
          return {
            ...item,
            width: newWidth,
            height: newHeight,
            rotation: item.rotation === 0 ? 90 : item.rotation === 90 ? 180 : item.rotation === 180 ? 270 : 0,
          }
        }
        return item
      }),
    )
    handleCloseContextMenu()
  }







  // 仕切りの長さ調整モーダルを表示する関数
  const handleOpenResizeModal = (id: string) => {
    const divider = placedItems.find((item) => item.id === id)
    if (divider && divider.type === "divider") {
      setResizingDivider(divider)
    }
    handleCloseContextMenu()
  }

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        handleCloseContextMenu()
      }
    }

    const handleClearLayout = () => {
      setNewItemIds(new Set())
    }

    document.addEventListener("click", handleClickOutside)
    window.addEventListener("clearLayout", handleClearLayout)

    return () => {
      document.removeEventListener("click", handleClickOutside)
      window.removeEventListener("clearLayout", handleClearLayout)
    }
  }, [contextMenu.visible])

  return (
    <div className="flex-1 overflow-visible w-full">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-medium text-[var(--color-indigo)] tracking-wide flex items-center">
          <span className="inline-block w-1 h-5 sm:h-6 bg-[var(--color-indigo)] mr-2"></span>
          詰め合わせ箱
        </h2>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <span>サイズ: {boxSize} ({boxSize.split('x')[0]}cm×{boxSize.split('x')[1]}cm)</span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            グリッド: {gridSize.width}×{gridSize.height}マス (1マス = 1mm)
          </span>
        </div>
      </div>
      <div className="flex justify-center overflow-visible w-full">
        <div
          ref={(node) => {
            boxRef.current = node
            drop(node)
          }}
          data-testid="box-area"
          className={`relative border-2 border-[var(--color-indigo)] bg-[var(--color-beige-dark)] ${isOver && canDrop ? "drag-over" : ""
            } rounded shadow-md overflow-hidden`}
          style={{
            width: Math.min(gridSize.width * cellSize, maxDisplaySize.maxWidth),
            height: Math.min(gridSize.height * cellSize, maxDisplaySize.maxHeight),
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize.width}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize.height}, ${cellSize}px)`,
          }}
        >
        {/* グリッド線 */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: gridSize.width + 1 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 border-r border-[var(--color-beige)]"
              style={{ left: `${i * cellSize}px` }}
            />
          ))}
          {Array.from({ length: gridSize.height + 1 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 border-b border-[var(--color-beige)]"
              style={{ top: `${i * cellSize}px` }}
            />
          ))}
        </div>

        {/* 配置プレビュー */}
        {previewPosition.visible && (
          <div
            className={`absolute pointer-events-none border-2 ${previewPosition.isValid
              ? previewPosition.isSnapped
                ? "border-[var(--color-gold)] bg-[var(--color-beige)]/70" // スナップ時のスタイル
                : "border-[var(--color-green)] bg-[var(--color-beige-dark)]/50" // 通常の有効時のスタイル
              : "border-[var(--color-red)] bg-[var(--color-beige-dark)]/50" // 無効時のスタイル
              }`}
            style={
              previewPosition.isGridLine
                ? {
                  left:
                    previewPosition.orientation === "vertical"
                      ? previewPosition.x * cellSize - 2
                      : previewPosition.x * cellSize,
                  top:
                    previewPosition.orientation === "horizontal"
                      ? previewPosition.y * cellSize - 2
                      : previewPosition.y * cellSize,
                  width: previewPosition.orientation === "vertical" ? 4 : previewPosition.width * cellSize,
                  height: previewPosition.orientation === "horizontal" ? 4 : previewPosition.height * cellSize,
                  zIndex: 30,
                  // スナップ時のアニメーション効果
                  boxShadow: previewPosition.isSnapped ? "0 0 8px rgba(191, 155, 48, 0.7)" : "none",
                  transition: "box-shadow 0.2s ease",
                }
                : {
                  left: previewPosition.x * cellSize,
                  top: previewPosition.y * cellSize,
                  width: previewPosition.width * cellSize,
                  height: previewPosition.height * cellSize,
                  zIndex: 30,
                }
            }
          />
        )}

        {/* 配置済みアイテム */}
        {placedItems.map((item) => (
          <PlacedItemComponent
            key={item.id}
            item={item}
            onContextMenu={(e) => handleContextMenu(e, item)}
            setPlacedItems={setPlacedItems}
            isNew={newItemIds.has(item.id)}
            cellSize={cellSize}
            onDoubleClick={handleShowItemInfo}
            checkValidPlacement={checkValidPlacement}
          />
        ))}
      </div>





      {/* コンテキストメニュー */}
      {contextMenu.visible && contextMenu.item && (
        <div ref={contextMenuRef}>
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            item={contextMenu.item}
            onDelete={handleDeleteItem}
            onToggleLock={handleToggleLock}
            onRotate={handleRotateItem}
            onResize={handleOpenResizeModal}
            onShowInfo={handleShowItemInfo}
            onClose={handleCloseContextMenu}
          />
        </div>
      )}

      {/* 仕切り長さ調整モーダル */}
      {resizingDivider && (
        <DividerResizeModal
          divider={resizingDivider}
          onResize={handleResizeDivider}
          onClose={() => setResizingDivider(null)}
          maxLength={
            resizingDivider.orientation === "horizontal"
              ? gridSize.width - resizingDivider.x
              : gridSize.height - resizingDivider.y
          }
        />
      )}

      {/* 商品情報モーダル */}
      {infoModalItem && (
        <div ref={productInfoRef}>
          <Dialog open={true} onOpenChange={(open) => !open && setInfoModalItem(null)}>
            <DialogContent className="sm:max-w-md bg-[var(--color-beige)] max-h-[80vh] overflow-y-auto !bg-opacity-100 border border-[var(--color-indigo-light)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--color-indigo)] border-b border-[var(--color-gray-light)] pb-2">
                  {infoSettings.showName ? infoModalItem.name : "商品情報"}
                </DialogTitle>
              </DialogHeader>
              <div className="flex gap-4">
                {infoSettings.showImage && (
                  <div
                    className="w-24 h-24 relative overflow-hidden rounded-sm border border-[var(--color-indigo-light)] cursor-zoom-in hover:opacity-90 transition-opacity group bg-white"
                    onClick={() => handleShowImageViewer(infoModalItem)}
                  >
                    <img
                      src={getEnlargedImageUrl(infoModalItem.itemId) || infoModalItem.imageUrl || "/placeholder.svg"}
                      alt={infoModalItem.name}
                      className="w-full h-full"
                      style={{ objectFit: "contain" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 rounded-full p-1.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-[var(--color-indigo)]"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          <line x1="11" y1="8" x2="11" y2="14" />
                          <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                      </div>
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-white/80 py-0.5 text-[var(--color-indigo)]">
                      クリックで拡大
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  {infoSettings.showName && (
                    <p className="mb-2">
                      <span className="font-medium text-[var(--color-indigo)]">商品名:</span> {infoModalItem.name}
                    </p>
                  )}
                  {infoSettings.showPrice && infoModalItem.price && (
                    <p className="mb-2">
                      <span className="font-medium text-[var(--color-indigo)]">価格:</span> {infoModalItem.price}円
                    </p>
                  )}
                  {infoSettings.showSize && (
                    <p className="mb-2">
                      <span className="font-medium text-[var(--color-indigo)]">サイズ:</span> {infoModalItem.width}×
                      {infoModalItem.height}
                    </p>
                  )}
                  {infoSettings.showCategory && infoModalItem.type === "sweet" && (
                    <p className="mb-2">
                      <span className="font-medium text-[var(--color-indigo)]">カテゴリ:</span>{" "}
                      {getCategoryName(infoModalItem.itemId)}
                    </p>
                  )}
                  {infoSettings.showCalories && infoModalItem.type === "sweet" && (
                    <p className="mb-2">
                      <span className="font-medium text-[var(--color-indigo)]">カロリー:</span>{" "}
                      {getCalories(infoModalItem.itemId)}kcal
                    </p>
                  )}
                  {infoSettings.showAllergies && infoModalItem.type === "sweet" && (
                    <div className="mb-1">
                      <span className="font-medium text-[var(--color-indigo)]">アレルギー:</span>{" "}
                      {getAllergies(infoModalItem.itemId).length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getAllergies(infoModalItem.itemId).map((allergy, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-0.5 bg-[var(--color-red)] text-white text-xs rounded-sm"
                            >
                              {allergy}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">なし</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 詳細説明 */}
              {infoSettings.showDescription && infoModalItem.type === "sweet" && (
                <div className="mt-4 pt-4 border-t border-[var(--color-gray-light)]">
                  <h4 className="font-medium text-[var(--color-indigo)] mb-2 border-l-2 border-[var(--color-indigo)] pl-2">
                    詳細説明
                  </h4>
                  <p className="text-sm text-[var(--color-black)] whitespace-pre-line">
                    {getDescription(infoModalItem.itemId)}
                  </p>
                </div>
              )}

              {/* 原材料情報 */}
              {infoSettings.showIngredients && infoModalItem.type === "sweet" && (
                <div className="mt-4 pt-4 border-t border-[var(--color-gray-light)]">
                  <h4 className="font-medium text-[var(--color-indigo)] mb-2 border-l-2 border-[var(--color-indigo)] pl-2">
                    原材料
                  </h4>
                  <p className="text-sm text-[var(--color-black)] whitespace-pre-line">
                    {getIngredients(infoModalItem.itemId)}
                  </p>
                </div>
              )}

              {/* 栄養成分情報 */}
              {infoSettings.showNutritionInfo && infoModalItem.type === "sweet" && (
                <div className="mt-4 pt-4 border-t border-[var(--color-gray-light)]">
                  <h4 className="font-medium text-[var(--color-indigo)] mb-2 border-l-2 border-[var(--color-indigo)] pl-2">
                    栄養成分
                  </h4>
                  <p className="text-sm text-[var(--color-black)] whitespace-pre-line">
                    {getNutritionInfo(infoModalItem.itemId)}
                  </p>
                </div>
              )}

              {/* 日持ち情報 */}
              {infoSettings.showShelfLife && infoModalItem.type === "sweet" && (
                <div className="mt-4 pt-4 border-t border-[var(--color-gray-light)]">
                  <h4 className="font-medium text-[var(--color-indigo)] mb-2 border-l-2 border-[var(--color-indigo)] pl-2">
                    日持ち
                  </h4>
                  <p className="text-sm text-[var(--color-black)] whitespace-pre-line">
                    {getShelfLife(infoModalItem.itemId)}
                  </p>
                </div>
              )}

              {/* 保存方法情報 */}
              {infoSettings.showStorageMethod && infoModalItem.type === "sweet" && (
                <div className="mt-4 pt-4 border-t border-[var(--color-gray-light)]">
                  <h4 className="font-medium text-[var(--color-indigo)] mb-2 border-l-2 border-[var(--color-indigo)] pl-2">
                    保存方法
                  </h4>
                  <p className="text-sm text-[var(--color-black)] whitespace-pre-line">
                    {getStorageMethod(infoModalItem.itemId)}
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* 画像拡大表示モーダル */}
      {imageViewerItem && (
        <ImageViewerModal
          imageUrl={getEnlargedImageUrl(imageViewerItem.itemId) || imageViewerItem.imageUrl}
          altText={imageViewerItem.name}
          onClose={() => setImageViewerItem(null)}
        />
      )}

      {/* エラーモーダル */}
      {errorModal.visible && (
        <ErrorModalComponent
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
        />
      )}
      </div>
    </div>
  )

  // カテゴリ名を取得する関数
  function getCategoryName(itemId: string): string {
    const sweet = sweets.find((s) => s.id === itemId)
    return sweet ? sweet.category : "不明"
  }

  // カロリーを取得する関数
  function getCalories(itemId: string): number {
    const sweet = sweets.find((s) => s.id === itemId)
    return sweet?.calories || 0
  }

  // アレルギー情報を取得する関数
  function getAllergies(itemId: string): string[] {
    const sweet = sweets.find((s) => s.id === itemId)
    return sweet?.allergies || []
  }

  // 詳細説明を取得する関数
  function getDescription(itemId: string): string {
    const sweet = sweets.find((s) => s.id === itemId)
    return sweet?.description || "詳細情報はありません。"
  }

  // 原材料情報を取得する関数
  function getIngredients(itemId: string): string {
    const sweet = sweets.find((s) => s.id === itemId)
    return sweet?.ingredients || "原材料情報はありません。"
  }

  // 栄養成分情報を取得する関数
  function getNutritionInfo(itemId: string): string {
    const sweet = sweets.find((s) => s.id === itemId)
    return sweet?.nutritionInfo || "栄養成分情報はありません。"
  }

  // 日持ち情報を取得する関数
  function getShelfLife(itemId: string): string {
    const sweet = sweets.find((s) => s.id === itemId)
    return sweet?.shelfLife || "日持ち情報はありません。"
  }

  // 保存方法情報を取得する関数
  function getStorageMethod(itemId: string): string {
    const sweet = sweets.find((s) => s.id === itemId)
    return sweet?.storageMethod || "保存方法情報はありません。"
  }

  // 拡大用画像URLを取得する関数
  function getEnlargedImageUrl(itemId: string): string | null {
    const sweet = sweets.find((s) => s.id === itemId)
    return sweet?.enlargedImagePath || null
  }
}