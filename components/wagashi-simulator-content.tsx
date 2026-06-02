"use client"

import type React from "react"

import BoxArea from "@/components/box-area"
import SelectionArea from "@/components/selection-area"

import HelpModal from "@/components/help-modal"
import InfoSettingsModal, { type InfoDisplaySettings } from "@/components/info-settings-modal"
import InventorySettingsModal from "@/components/inventory-settings-modal"
import ProductUpdateModal from "@/components/product-update-modal"
import PrintModal from "@/components/print-modal"
import BoxSelectionModal from "@/components/box-selection-modal"
import { ALLERGY_OPTIONS } from "@/data/allergy-options"
import type { BoxSize, PlacedItem, SweetItem, BoxType } from "@/types/types"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PlusCircle, Save, Upload, HelpCircle, Settings, Package, Cloud, Printer, Trash2, Eye } from "lucide-react"

import { useState, useEffect, useMemo, useRef } from "react"
//追加
import { useRouter } from "next/navigation"
import { generateId } from "@/lib/utils"
import { toast } from "sonner"

// 選択中商品表示のモーダル（仮）
import SelectItemModal from "@/components/select-item-modal"

type AutoBoxDef = {
  size: number
  sizeStr: BoxSize
  name: string
  price: number
}

// Box type definitions (size in cm and price)
const BOX_TYPE_DEFS: AutoBoxDef[] = [
  { size: 22, sizeStr: "22x22", name: "B1", price: 220 },
  { size: 25.5, sizeStr: "25.5x22", name: "B2", price: 220 },
  { size: 28.5, sizeStr: "28.5x22", name: "B3", price: 275 },
  { size: 32.5, sizeStr: "32.5x22", name: "B4", price: 275 },
  { size: 35, sizeStr: "35x22", name: "B5", price: 330 },
  { size: 37.5, sizeStr: "37.5x22", name: "B6", price: 330 },
  { size: 39, sizeStr: "39x22", name: "B7", price: 330 },
  { size: 42, sizeStr: "42x22", name: "B8", price: 385 },
  { size: 45, sizeStr: "45x22", name: "B9", price: 385 },
]

function getMaxPlacedCm(items: any[]) {
  return Math.max(
    ...items
      .filter(item => item.type === "sweet")
      .map(item => (item.x + item.width) / 10), // mm → cm
    0
  )
}


function parseBoxSize(size: string) {
  const [rawWidth, rawHeight] = size.replace(/[×*]/g, "x").split("x")
  const width = Number(rawWidth)
  const height = Number(rawHeight)

  if (Number.isNaN(width) || Number.isNaN(height)) {
    return null
  }

  return { width, height }
}

function isSizeGreater(a: string, b: string) {
  const parsedA = parseBoxSize(a)
  const parsedB = parseBoxSize(b)
  if (!parsedA || !parsedB) return false

  if (parsedA.width !== parsedB.width) {
    return parsedA.width > parsedB.width
  }

  return parsedA.height > parsedB.height
}

// インターフェース（型宣言）
interface WagashiSimulatorContentProps {
  boxSize: BoxSize
  setBoxSize: React.Dispatch<React.SetStateAction<BoxSize>>
  placedItems: PlacedItem[]
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItem[]>>
  isHelpOpen: boolean
  setIsHelpOpen: React.Dispatch<React.SetStateAction<boolean>>
  isSettingsOpen: boolean
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>
  infoSettings: InfoDisplaySettings
  handleSaveLayout: () => void
  handleSaveWithCustomerCode: () => void
  handleLoadLayout: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleClearLayout: () => void
  handleSaveSettings: (newSettings: InfoDisplaySettings) => void
  selectedStoreId: string
  isSavingCustomerCode: boolean
  selectedBoxType?: BoxType | null
  onBoxTypeChange?: (boxType: BoxType | null) => void
}

export default function WagashiSimulatorContent({
  boxSize,
  setBoxSize,
  placedItems,
  setPlacedItems,
  isHelpOpen,
  setIsHelpOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  infoSettings,
  handleSaveLayout,
  handleSaveWithCustomerCode,
  handleLoadLayout,
  handleClearLayout,
  handleSaveSettings,
  selectedStoreId,
  isSavingCustomerCode,
  selectedBoxType,
  onBoxTypeChange,
}: WagashiSimulatorContentProps) {
  // 在庫管理モーダルの状態
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  // 追加：袋選択状態
  const [selectedBag, setSelectedBag] = useState<{ type: string; qty: number }>({ type: "mini", qty: 0 })
  // 在庫データの状態
  const [inventoryData, setInventoryData] = useState<SweetItem[]>([])
  // 商品変更通知モーダルの状態
  const [isProductUpdateModalOpen, setIsProductUpdateModalOpen] = useState(false)
  const [productUpdateMessage, setProductUpdateMessage] = useState("商品情報が変更されました")
  // 印刷モーダルの状態
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  // 箱選択モーダルの状態
  const [isBoxSelectionOpen, setIsBoxSelectionOpen] = useState(false)
  const [isDesktopLayout, setIsDesktopLayout] = useState(false)
  //選択中モーダルの状態
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false)
  const [isAllergyFilterOpen, setIsAllergyFilterOpen] = useState(false)
  const [selectedAllergyFilters, setSelectedAllergyFilters] = useState<string[]>([])
  const [companyMaxBoxSize, setCompanyMaxBoxSize] = useState<string | null>(null)
  const [companyBoxDefs, setCompanyBoxDefs] = useState<AutoBoxDef[]>(BOX_TYPE_DEFS)
  const [autoArrangeMode, setAutoArrangeMode] = useState(false)
  const [autoArrangeItems, setAutoArrangeItems] = useState<SweetItem[]>([])

  //追加： Next.js のルーター
  const router = useRouter()

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)")
    const updateLayout = () => setIsDesktopLayout(mediaQuery.matches)

    updateLayout()
    mediaQuery.addEventListener("change", updateLayout)

    return () => mediaQuery.removeEventListener("change", updateLayout)
  }, [])

  useEffect(() => {
    const fetchCompanyBoxTypes = async () => {
      try {
        const response = await fetch("/api/box-types")
        if (!response.ok) return

        const boxTypes = (await response.json()) as BoxType[]
        if (!Array.isArray(boxTypes) || boxTypes.length === 0) return

        const normalizedDefs = boxTypes
          .map((boxType) => {
            const parsed = parseBoxSize(boxType.size)
            return {
              size: parsed?.width ?? Number.parseFloat(boxType.size.split("x")[0]),
              sizeStr: boxType.size,
              name: boxType.name,
              price: boxType.price,
            }
          })
          .filter((def) => Number.isFinite(def.size) && def.size > 0)
          .sort((a, b) => a.size - b.size)

        if (normalizedDefs.length === 0) return

        setCompanyBoxDefs(normalizedDefs)
        const maxSize = normalizedDefs[normalizedDefs.length - 1].sizeStr

        setCompanyMaxBoxSize(maxSize)
      } catch (error) {
        console.error("Failed to fetch box types for max-size check:", error)
      }
    }

    fetchCompanyBoxTypes()
  }, [])

  const getBoxDefForCm = (cm: number) => {
    return (
      companyBoxDefs.find((def) => cm <= def.size) ||
      companyBoxDefs[companyBoxDefs.length - 1]
    )
  }

  const getAutoSelectedBox = (items: PlacedItem[]) => {
    const maxCm = getMaxPlacedCm(items)
    return getBoxDefForCm(maxCm)
  }

  // 要素の参照
  const selectionAreaRef = useRef<HTMLDivElement>(null)
  const boxAreaRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const productInfoRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLButtonElement>(null)
  const saveLoadRef = useRef<HTMLDivElement>(null)
  const customerCodeSaveRef = useRef<HTMLButtonElement>(null)
  const printRef = useRef<HTMLButtonElement>(null)
  const allergyPanelRef = useRef<HTMLDivElement>(null)

  // 商品変更通知を受け取る
  useEffect(() => {
    const handleProductUpdate = (event: CustomEvent) => {
      const message = event.detail?.message || "商品情報が変更されました"
      setProductUpdateMessage(message)
      setIsProductUpdateModalOpen(true)
    }

    window.addEventListener("productUpdate", handleProductUpdate as EventListener)

    return () => {
      window.removeEventListener("productUpdate", handleProductUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isAllergyFilterOpen) return
      if (allergyPanelRef.current && !allergyPanelRef.current.contains(event.target as Node)) {
        setIsAllergyFilterOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isAllergyFilterOpen])

  // 在庫データを更新する関数
  const handleUpdateInventory = (updatedSweets: SweetItem[]) => {
    // グローバルな在庫データを更新
    // 注意: 実際のアプリケーションでは、この更新方法は適切ではありません
    // 本来はコンテキストやReduxなどの状態管理を使用するべきです
    ; (window as any).updatedSweetsData = updatedSweets
    setInventoryData(updatedSweets)

    // 選択エリアを更新するためにイベントを発火
    const event = new CustomEvent("inventoryUpdated", { detail: updatedSweets })
    window.dispatchEvent(event)
  }

  // 配置済みアイテムを削除する関数
  const handleRemovePlacedItems = (itemIds: string[]) => {
    setPlacedItems(prev => prev.filter(item => !itemIds.includes(item.id)))
  }

  // ページをリロードする関数
  const handleReload = () => {
    window.location.reload()
  }

  const handleToggleAutoArrangeMode = () => {
    setAutoArrangeMode((prev) => !prev)
  }

  const handleAddAutoArrangeItem = (item: SweetItem) => {
    if (!item.inStock) {
      toast.error("在庫切れの商品は追加できません")
      return
    }

    setAutoArrangeItems((prev) => [...prev, item])
    setAutoArrangeMode(true)
  }

  const handleRemoveAutoArrangeItem = (index: number) => {
    setAutoArrangeItems((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleClearAutoArrangeItems = () => {
    setAutoArrangeItems([])
  }

  const rectanglesOverlap = (
    leftA: number,
    topA: number,
    widthA: number,
    heightA: number,
    leftB: number,
    topB: number,
    widthB: number,
    heightB: number,
  ) => {
    const rightA = leftA + widthA
    const bottomA = topA + heightA
    const rightB = leftB + widthB
    const bottomB = topB + heightB

    return !(rightA <= leftB || leftA >= rightB || bottomA <= topB || topA >= bottomB)
  }

  const intersectsGridLineDivider = (
    x: number,
    y: number,
    width: number,
    height: number,
    divider: PlacedItem,
  ) => {
    if (divider.type !== "divider" || !divider.isGridLine || !divider.orientation) {
      return false
    }

    if (divider.orientation === "horizontal") {
      const dividerY = divider.y
      const dividerLeft = divider.x
      const dividerRight = divider.x + divider.width

      if (y < dividerY && y + height > dividerY) {
        return !(x + width <= dividerLeft || x >= dividerRight)
      }

      return false
    }

    const dividerX = divider.x
    const dividerTop = divider.y
    const dividerBottom = divider.y + divider.height

    if (x < dividerX && x + width > dividerX) {
      return !(y + height <= dividerTop || y >= dividerBottom)
    }

    return false
  }

  const canPlaceAutoItem = (
    x: number,
    y: number,
    width: number,
    height: number,
    boxWidth: number,
    boxHeight: number,
    occupiedItems: PlacedItem[],
  ) => {
    if (x < 0 || y < 0 || x + width > boxWidth || y + height > boxHeight) {
      return false
    }

    return occupiedItems.every((item) => {
      if (item.type === "divider" && item.isGridLine) {
        return !intersectsGridLineDivider(x, y, width, height, item)
      }

      return !rectanglesOverlap(x, y, width, height, item.x, item.y, item.width, item.height)
    })
  }

  const findPackedPosition = (
    width: number,
    height: number,
    boxWidth: number,
    boxHeight: number,
    occupiedItems: PlacedItem[],
    placedItemsInBatch: PlacedItem[],
  ) => {
    const step = 1

    for (let y = 0; y <= boxHeight - height; y += step) {
      for (let x = 0; x <= boxWidth - width; x += step) {
        const blockedByBatch = placedItemsInBatch.some((item) =>
          rectanglesOverlap(x, y, width, height, item.x, item.y, item.width, item.height),
        )

        if (blockedByBatch) {
          continue
        }

        if (canPlaceAutoItem(x, y, width, height, boxWidth, boxHeight, occupiedItems)) {
          return { x, y }
        }
      }
    }

    return null
  }

  const handleExecuteAutoArrange = () => {
    if (autoArrangeItems.length === 0) {
      toast.error("詰め合わせリストに商品を追加してください")
      return
    }

    const [boxWidthCm, boxHeightCm] = boxSize.split("x").map(Number)
    const boxWidth = Math.round(boxWidthCm * 10)
    const boxHeight = Math.round(boxHeightCm * 10)
    const occupiedItems = placedItems.filter((item) => item.type !== "sweet")
    const nextPlacedItems: PlacedItem[] = []
    const packedOrder = [...autoArrangeItems].sort((a, b) => {
      const areaA = a.width * a.height
      const areaB = b.width * b.height

      if (areaA !== areaB) {
        return areaB - areaA
      }

      const sideA = Math.max(a.width, a.height)
      const sideB = Math.max(b.width, b.height)
      return sideB - sideA
    })

    for (const sweet of packedOrder) {
      const width = Math.round(sweet.width * 10)
      const height = Math.round(sweet.height * 10)

      if (width > boxWidth || height > boxHeight) {
        toast.error(`${sweet.name} は現在の箱に入りません`)
        return
      }

      const packedPosition = findPackedPosition(width, height, boxWidth, boxHeight, occupiedItems, nextPlacedItems)

      if (!packedPosition) {
        toast.error(`${sweet.name} を配置できませんでした。詰め合わせリストを減らしてください`)
        return
      }

      nextPlacedItems.push({
        id: generateId(),
        itemId: sweet.id,
        type: "sweet",
        x: packedPosition.x,
        y: packedPosition.y,
        width,
        height,
        rotation: 0,
        isLocked: false,
        imageUrl: sweet.placedImageUrl || sweet.imageUrl || "",
        name: sweet.name,
        price: sweet.price,
      })
    }

    setPlacedItems([...occupiedItems, ...nextPlacedItems])
    setAutoArrangeItems([])
    setAutoArrangeMode(false)
    toast.success("自動詰め合わせを実行しました")
  }

  // 箱選択のハンドラー
  const handleBoxSelection = (newBoxSize: BoxSize, boxType: BoxType) => {
    setBoxSize(newBoxSize)
    onBoxTypeChange?.(boxType)
  }

  const toggleAllergyFilter = (allergy: string) => {
    setSelectedAllergyFilters((prev) =>
      prev.includes(allergy) ? prev.filter((item) => item !== allergy) : [...prev, allergy]
    )
  }

  // 和菓子が配置されているかチェック
  const hasPlacedItems = placedItems.length > 0
  const isCustomerCodeSaveDisabled = isSavingCustomerCode || !hasPlacedItems

  // 合計金額を計算する関数
  const calculateTotalPrice = () => {
    // 和菓子は「固定価格」で合計
    const sweetsSubTotal = placedItems
      .filter(item => item.type === "sweet")
      .reduce((sum, item) => sum + (item.price ?? 0), 0)

    // 配置から箱を自動選択
    const boxDef = getAutoSelectedBox(placedItems)
    const boxPrice = boxDef.price ?? 0

    // 税計算
    const sweetsTotal = sweetsSubTotal * 1.08

    return Math.floor(sweetsTotal + boxPrice)
  }

  // 選択中の箱（表示用） — B9 を選択している場合は配置位置に応じて実際の箱タイプを決定する
  const getEffectiveBoxDef = () => {
    if (!selectedBoxType) return null

    const parsedSelectedSize = parseBoxSize(selectedBoxType.size)
    const selectedBoxDef = companyBoxDefs.find((def) => def.sizeStr === selectedBoxType.size) ?? {
      size: parsedSelectedSize?.width ?? Number.parseFloat(selectedBoxType.size.split("x")[0]),
      sizeStr: selectedBoxType.size,
      name: selectedBoxType.name,
      price: selectedBoxType.price,
    }

    // 企業ごとの最大サイズ箱を選択しているときのみ、配置位置に応じて箱タイプを動的判定
    const fallbackMaxSize = companyBoxDefs[companyBoxDefs.length - 1]?.sizeStr
    const maxSizeForDynamicCheck = companyMaxBoxSize ?? fallbackMaxSize
    if (maxSizeForDynamicCheck && selectedBoxDef.sizeStr === maxSizeForDynamicCheck) {
      // 動的判定: 配置済み和菓子の右端位置から最も大きい箱定義を選択
      const sweets = placedItems.filter((it) => it.type === "sweet")
      if (sweets.length === 0) return selectedBoxDef
      let maxIdx = 0
      sweets.forEach((item) => {
        const centerCm = (item.x + item.width) / 10
        const def = getBoxDefForCm(centerCm)
        const idx = companyBoxDefs.findIndex((d) => d.size === def.size)
        if (idx > maxIdx) maxIdx = idx
      })
      return companyBoxDefs[maxIdx]
    }
    return selectedBoxDef
  }
  const effectiveBoxDef = getEffectiveBoxDef()

  const effectiveBoxSize = useMemo<BoxSize>(() => {
    if (!effectiveBoxDef) return boxSize
    return effectiveBoxDef.sizeStr
  }, [effectiveBoxDef, boxSize])

  const handleConfirm = () => {
    if (hasOverlap) return

    sessionStorage.setItem("placedItems", JSON.stringify(placedItems))
    sessionStorage.setItem("boxSize", effectiveBoxSize)
    sessionStorage.setItem("selectedBoxType", JSON.stringify(effectiveBoxDef ?? selectedBoxType))
    sessionStorage.setItem("products", JSON.stringify(groupedPlacedItems))
    sessionStorage.setItem("needsNoshi", JSON.stringify(false))
    sessionStorage.setItem("needsBag", JSON.stringify(selectedBag.qty > 0))
    sessionStorage.setItem("selectedBag", JSON.stringify(selectedBag))
    router.push("/confirm")
  }

  // 詰め合わせの上限金額（円）を設定する状態
  const [priceLimitStr, setPriceLimitStr] = useState<string>("")
  const [priceLimit, setPriceLimit] = useState<number | null>(null)

  const applyPriceLimit = () => {
    const n = parseInt(priceLimitStr.replace(/[^0-9]/g, ""))
    if (!Number.isNaN(n)) {
      setPriceLimit(n)
    } else {
      setPriceLimit(null)
    }
  }

  const clearPriceLimit = () => {
    setPriceLimitStr("")
    setPriceLimit(null)
  }

  const remainingAmount = priceLimit !== null ? priceLimit - calculateTotalPrice() : null

  // 配置済み商品のグループ化（itemId ベース）
  const groupedPlacedItems = Object.values(
    placedItems
      .filter((item) => item.type === 'sweet')
      .reduce((acc: Record<string, any>, item) => {
        const key = item.itemId || item.name
        if (!acc[key]) {
          acc[key] = {
            itemId: item.itemId,
            name: item.name,
            price: item.price || 0,
            imageUrl: item.imageUrl,
            qty: 0,
          }
        }
        acc[key].qty += 1
        if ((item.price || 0) > acc[key].price) acc[key].price = item.price || acc[key].price
        return acc
      }, {})
  )

  // 配置済みアイテム間の重なりがあるかをチェック
  const hasOverlap = useMemo(() => {
    const sweets = placedItems.filter((it) => it.type === 'sweet')
    for (let i = 0; i < sweets.length; i++) {
      for (let j = i + 1; j < sweets.length; j++) {
        const a = sweets[i]
        const b = sweets[j]
        const aRight = a.x + a.width
        const aBottom = a.y + a.height
        const bRight = b.x + b.width
        const bBottom = b.y + b.height
        if (!(aRight <= b.x || a.x >= bRight || aBottom <= b.y || a.y >= bBottom)) {
          return true
        }
      }
    }
    return false
  }, [placedItems])

  return (
    <TooltipProvider>
      <div className="min-h-screen washi-bg">
        <header className="bg-[var(--color-indigo)] text-white shadow-md relative overflow-visible">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/pattern-japanese.svg')] bg-repeat"></div>
          </div>
          <div className="container mx-auto relative z-10">
            {/* モバイル用のヘッダー */}
            <div className="lg:hidden p-3">
              {/* 第1行: 箱サイズとメインアクション */}
              <div className="flex items-center justify-between mb-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      data-testid="box-size-selector"
                      variant="outline"
                      size="sm"
                      className="bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-white px-2 relative"
                      onClick={() => setIsBoxSelectionOpen(true)}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      <span className="text-xs">
                        {selectedBoxType ? selectedBoxType.name : boxSize}
                      </span>
                      <svg className="h-2 w-2 ml-1 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>箱のサイズを変更</p>
                  </TooltipContent>
                </Tooltip>
                
                <div className="flex gap-1">
                  <Button
                    data-testid="clear-layout-button-desktop"
                    variant="outline"
                    size="sm"
                    className="bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-white px-2"
                    onClick={handleClearLayout}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-white px-2"
                    onClick={handleSaveLayout}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <label className="cursor-pointer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-white px-2"
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <input id="file-upload" type="file" accept=".json" className="hidden" onChange={handleLoadLayout} />
                  </label>
                </div>
              </div>

              {/* 第2行: カスタマーコード保存とその他のアクション */}
              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-white disabled:opacity-50 disabled:cursor-not-allowed ${!hasPlacedItems && !isSavingCustomerCode ? 'opacity-60' : ''
                        }`}
                      onClick={handleSaveWithCustomerCode}
                      disabled={isCustomerCodeSaveDisabled}
                      ref={customerCodeSaveRef as unknown as React.RefObject<HTMLButtonElement>}
                    >
                      {isSavingCustomerCode ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                          保存中
                        </>
                      ) : (
                        <>
                          <Cloud className="h-4 w-4 mr-1" />
                          コード保存
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {isSavingCustomerCode ? (
                      <p>カスタマーコードを生成中です...</p>
                    ) : !hasPlacedItems ? (
                      <p>和菓子を配置してから保存してください</p>
                    ) : (
                      <p>詰め合わせをカスタマーコードで保存します</p>
                    )}
                  </TooltipContent>
                </Tooltip>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-[var(--color-indigo-light)] px-2"
                    onClick={() => setIsPrintModalOpen(true)}
                    ref={printRef as unknown as React.RefObject<HTMLButtonElement>}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>

                  {/* 確認ボタン（モバイル）: 他のボタンと同じ見た目で /confirm に遷移します */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-white hover:bg-[var(--color-indigo-light)] px-2 ${hasOverlap ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (hasOverlap) return
                      // 配置済みアイテムとボックスサイズを SessionStorage に保存
                      sessionStorage.setItem("placedItems", JSON.stringify(placedItems))
                      sessionStorage.setItem("boxSize", boxSize)
                      sessionStorage.setItem("selectedBoxType", JSON.stringify(selectedBoxType))
                      // products（詰め合わせ内訳）とオプション情報も保存
                      sessionStorage.setItem("products", JSON.stringify(groupedPlacedItems))
                      sessionStorage.setItem("needsNoshi", JSON.stringify(false))
                      sessionStorage.setItem("needsBag", JSON.stringify(selectedBag.qty > 0))
                      sessionStorage.setItem("selectedBag", JSON.stringify(selectedBag))
                      router.push('/confirm')
                    }}
                    disabled={hasOverlap}
                    title={hasOverlap ? '商品が重なっています：確認できません' : undefined}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-[var(--color-indigo-light)] px-2"
                    onClick={() => setIsInventoryOpen(true)}
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-[var(--color-indigo-light)] px-2"
                    onClick={() => setIsSettingsOpen(true)}
                    ref={settingsRef as unknown as React.RefObject<HTMLButtonElement>}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-[var(--color-indigo-light)] px-2"
                    onClick={() => setIsHelpOpen(true)}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* デスクトップ用のヘッダー */}
            <div className="hidden lg:flex justify-center items-center p-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-2" ref={saveLoadRef}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-testid="box-size-selector"
                        variant="outline"
                        size="sm"
                        className="bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-white relative"
                        onClick={() => setIsBoxSelectionOpen(true)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        <span>
                          {selectedBoxType ? selectedBoxType.name : boxSize}
                        </span>
                        <svg className="h-3 w-3 ml-2 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>箱のサイズを変更（クリックして選択）</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    data-testid="clear-layout-button"
                    variant="outline"
                    size="sm"
                    className="bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-white"
                    onClick={handleClearLayout}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    新規
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-white"
                    onClick={handleSaveLayout}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                  <label className="cursor-pointer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-white"
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      読込
                    </Button>
                    <input id="file-upload" type="file" accept=".json" className="hidden" onChange={handleLoadLayout} />
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-white disabled:opacity-50 disabled:cursor-not-allowed ${!hasPlacedItems && !isSavingCustomerCode ? 'opacity-60' : ''
                          }`}
                        onClick={handleSaveWithCustomerCode}
                        disabled={isCustomerCodeSaveDisabled}
                        ref={customerCodeSaveRef as unknown as React.RefObject<HTMLButtonElement>}
                      >
                        {isSavingCustomerCode ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                            <span className="hidden xl:inline">保存中...</span>
                            <span className="xl:hidden">保存中</span>
                          </>
                        ) : (
                          <>
                            <Cloud className="h-4 w-4 mr-1" />
                            <span className="hidden xl:inline">カスタマーコード保存</span>
                            <span className="xl:hidden">コード保存</span>
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {isSavingCustomerCode ? (
                        <p>カスタマーコードを生成中です...</p>
                      ) : !hasPlacedItems ? (
                        <p>和菓子を配置してから保存してください</p>
                      ) : (
                        <p>詰め合わせをカスタマーコードで保存します</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-[var(--color-indigo-light)]"
                  onClick={() => setIsPrintModalOpen(true)}
                  ref={printRef as unknown as React.RefObject<HTMLButtonElement>}
                >
                  <Printer className="h-5 w-5" />
                  <span className="hidden xl:inline ml-1">印刷</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-[var(--color-indigo-light)]"
                  onClick={() => setIsInventoryOpen(true)}
                >
                  <Package className="h-5 w-5" />
                  <span className="hidden xl:inline ml-1">在庫管理</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-[var(--color-indigo-light)]"
                  onClick={() => setIsSettingsOpen(true)}
                  ref={settingsRef as unknown as React.RefObject<HTMLButtonElement>}
                >
                  <Settings className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-[var(--color-indigo-light)]"
                  onClick={() => setIsHelpOpen(true)}
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo-light)] border-[var(--color-indigo-dark)]"
                  onClick={() => setIsSelectionModalOpen(true)}
                >
                  一覧
                  <span className="hidden xl:inline ml-1">現在の商品</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[var(--color-indigo-light)] hover:bg-[var(--color-indigo-light)] border-[var(--color-indigo-dark)]"
                  onClick={() => setIsAllergyFilterOpen((prev) => !prev)}
                >
                  アレルギー
                  {selectedAllergyFilters.length > 0 && (
                    <span className="ml-2 rounded-full bg-white text-[var(--color-indigo)] px-1.5 py-0.5 text-xs">
                      {selectedAllergyFilters.length}
                    </span>
                  )}
                </Button>
              </div>

              {isAllergyFilterOpen && (
                <div
                  ref={allergyPanelRef}
                  className="absolute right-4 top-full mt-2 z-30 w-72 max-h-80 overflow-y-auto rounded-md border border-[var(--color-indigo-light)] bg-white p-3 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-[var(--color-indigo)]">除外するアレルギー</p>
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:text-gray-700"
                      onClick={() => setSelectedAllergyFilters([])}
                    >
                      クリア
                    </button>
                  </div>

                  <div className="space-y-1">
                    {ALLERGY_OPTIONS.map((allergy) => (
                      <label key={allergy} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAllergyFilters.includes(allergy)}
                          onChange={() => toggleAllergyFilter(allergy)}
                        />
                        <span>{allergy}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto p-1 sm:p-2 lg:p-4">
          {/* モバイル用のレイアウト */}
          <div className="lg:hidden space-y-4">
            {/* 合計金額表示（モバイル） */}
            <div className="p-3 bg-white rounded-sm border border-[var(--color-indigo-light)] shadow-sm">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">和菓子:</span>
                  <span>
                    {placedItems
                      .filter((item) => item.type === "sweet" && item.price)
                      .reduce((total, item) => total + (item.price || 0), 0)
                      .toLocaleString()}円
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">箱代:</span>
                  <span>{effectiveBoxDef ? effectiveBoxDef.price.toLocaleString() : selectedBoxType ? selectedBoxType.price.toLocaleString() : 0}円</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-lg font-medium text-[var(--color-indigo)]">合計:</span>
                  <span className="text-xl font-bold text-[var(--color-indigo)]" data-testid="total-price">
                    {calculateTotalPrice().toLocaleString()}円
                  </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-[var(--color-indigo)] hover:bg-[var(--color-indigo-light)] ml-2 ${hasOverlap ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={handleConfirm}
                      disabled={hasOverlap}
                      title={hasOverlap ? '商品が重なっています：確認できません' : undefined}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>

                </div>
              </div>
            </div>
            
            {/* 和菓子選択エリア（モバイルでは上部に配置） */}
            <div ref={selectionAreaRef} className="w-full">
              <SelectionArea
                placedItems={placedItems}
                setPlacedItems={setPlacedItems}
                inventoryData={inventoryData}
                selectedStoreId={selectedStoreId}
                excludedAllergies={selectedAllergyFilters}
                autoArrangeMode={autoArrangeMode}
                autoArrangeItems={autoArrangeItems}
                onToggleAutoArrangeMode={handleToggleAutoArrangeMode}
                onAddAutoArrangeItem={handleAddAutoArrangeItem}
                onRemoveAutoArrangeItem={handleRemoveAutoArrangeItem}
                onClearAutoArrangeItems={handleClearAutoArrangeItems}
                onExecuteAutoArrange={handleExecuteAutoArrange}
              />
            </div>
            
            {/* 詰め合わせエリア */}
            <div ref={boxAreaRef} className="w-full">
              <BoxArea
                boxSize={boxSize}
                activeBoxSize={effectiveBoxSize}
                placedItems={placedItems}
                setPlacedItems={setPlacedItems}
                infoSettings={infoSettings}
                contextMenuRef={contextMenuRef as React.RefObject<HTMLDivElement>}
                productInfoRef={productInfoRef as React.RefObject<HTMLDivElement>}
                selectedStoreId={selectedStoreId}
                dndEnabled={!isDesktopLayout}
              />
            </div>
          </div>

          {/* デスクトップ用のレイアウト */}
          {/* 合計金額表示（デスクトップ） */}
          <div className="w-3/4 mb-4 p-1 bg-white rounded-sm border border-[var(--color-indigo-light)] shadow-sm">
            <div className="space-y-2">
              <div className="pt-2 flex justify-between">
                <span className="text-xl font-bold text-[var(--color-indigo)]" data-testid="total-price">
                  {calculateTotalPrice().toLocaleString()}円 (箱代：{getAutoSelectedBox(placedItems).price ?? 0}円)
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className={`font-bold px-4 py-1 rounded bg-[var(--color-indigo-light)] border border-[var(--color-indigo)] text-white transition-colors text-base shadow ${hasOverlap ? 'opacity-60 cursor-not-allowed hover:bg-[var(--color-indigo-light)]' : 'hover:bg-[var(--color-indigo)] hover:text-white'}`}
                  onClick={handleConfirm}
                  disabled={hasOverlap}
                  title={hasOverlap ? '商品が重なっています：確認できません' : undefined}
                >
                  確認
                </Button>

                {/* 上限金額設定（デスクトップ） */}
                <div className="flex items-center gap-2 flex-nowrap">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="上限額（円）を入力"
                    value={priceLimitStr}
                    onChange={(e) => setPriceLimitStr(e.target.value)}
                    className="flex-1 min-w-0 p-2 border rounded text-sm"                    />
                  <button onClick={applyPriceLimit} className="px-3 py-2 bg-[var(--color-indigo)] text-white rounded text-sm whitespace-nowrap">設定</button>
                  <button onClick={clearPriceLimit} className="px-3 py-2 border rounded text-sm whitespace-nowrap">クリア</button>
                </div>
                {priceLimit !== null && (
                  <div className="mt-2 text-sm">
                    {remainingAmount !== null && remainingAmount >= 0 ? (
                      <div className="text-green-600">残り: {remainingAmount.toLocaleString()}円</div>
                    ) : (
                      <div className="text-red-600">超過: {Math.abs(remainingAmount || 0).toLocaleString()}円</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* 箱エリア */}
          <div className="hidden lg:flex gap-4">
            <div ref={boxAreaRef} className="flex-1 overflow-visible max-w-none w-full">
              <BoxArea
                boxSize={boxSize}
                activeBoxSize={effectiveBoxSize}
                placedItems={placedItems}
                setPlacedItems={setPlacedItems}
                infoSettings={infoSettings}
                contextMenuRef={contextMenuRef as React.RefObject<HTMLDivElement>}
                productInfoRef={productInfoRef as React.RefObject<HTMLDivElement>}
                selectedStoreId={selectedStoreId}
                dndEnabled={isDesktopLayout}
              />
            </div>            

            {/* 和菓子選択（右端） */}
            <div className="flex flex-col min-h-[calc(100vh-140px)] w-56 xl:w-64 flex-shrink-0">
              <div ref={selectionAreaRef} className="flex-1">
                <SelectionArea
                  placedItems={placedItems}
                  setPlacedItems={setPlacedItems}
                  inventoryData={inventoryData}
                  selectedStoreId={selectedStoreId}
                  excludedAllergies={selectedAllergyFilters}
                  autoArrangeMode={autoArrangeMode}
                  autoArrangeItems={autoArrangeItems}
                  onToggleAutoArrangeMode={handleToggleAutoArrangeMode}
                  onAddAutoArrangeItem={handleAddAutoArrangeItem}
                  onRemoveAutoArrangeItem={handleRemoveAutoArrangeItem}
                  onClearAutoArrangeItems={handleClearAutoArrangeItems}
                  onExecuteAutoArrange={handleExecuteAutoArrange}
                />
              </div>
            </div>

          </div>
        </main>

        {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}

        {/* 選択中モーダル（仮） */}
        {isSelectionModalOpen && (
          <SelectItemModal
            onClose={() => setIsSelectionModalOpen(false)}
            items={groupedPlacedItems as Array<{
              itemId?: string
              name: string
              price: number
              imageUrl?: string
              qty: number
            }>}
            totalPrice={groupedPlacedItems.reduce((total, item) => total + item.price * item.qty, 0)}
          />
        )}

        {isSettingsOpen && (
          <InfoSettingsModal
            settings={infoSettings}
            onSave={handleSaveSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
        {isInventoryOpen && (
          <InventorySettingsModal
            onClose={() => setIsInventoryOpen(false)}
            onUpdateInventory={handleUpdateInventory}
            placedItems={placedItems}
            onRemovePlacedItems={handleRemovePlacedItems}
            selectedStoreId={selectedStoreId}
          />
        )}
        <ProductUpdateModal
          isOpen={isProductUpdateModalOpen}
          onClose={() => setIsProductUpdateModalOpen(false)}
          onReload={handleReload}
          message={productUpdateMessage}
        />
        {isPrintModalOpen && (
          <PrintModal
            placedItems={placedItems}
            boxSize={boxSize}
            infoSettings={infoSettings}
            onClose={() => setIsPrintModalOpen(false)}
            selectedStoreId={selectedStoreId}
          />
        )}

        {/* 箱選択モーダル */}
        <BoxSelectionModal
          isOpen={isBoxSelectionOpen}
          onClose={() => setIsBoxSelectionOpen(false)}
          onSelect={handleBoxSelection}
          currentBoxSize={boxSize}
          currentBoxType={selectedBoxType}
        />

      </div>
    </TooltipProvider>
  )
}
