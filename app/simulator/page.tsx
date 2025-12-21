"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { InfoDisplaySettings } from "@/components/info-settings-modal"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { BoxSize, PlacedItem, BoxType } from "@/types/types"
import saveAs from "file-saver"

import WagashiSimulatorContent from "@/components/wagashi-simulator-content"
import MaintenanceMode from "@/components/maintenance-mode"
import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"
import CustomerCodeModal from "@/components/customer-code-modal"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Store } from "lucide-react"
import { toast } from "sonner"

export default function WagashiSimulator() {
  const router = useRouter()
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState<string>("")

  // メンテナンスモードの状態を取得
  const { 
    isMaintenanceMode, 
    maintenanceMessage, 
    estimatedEndTime, 
    isLoading: isMaintenanceLoading,
    refetch: refetchMaintenanceStatus 
  } = useMaintenanceMode()

  const [boxSize, setBoxSize] = useState<BoxSize>("45x22")
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedBoxType, setSelectedBoxType] = useState<BoxType | null>(null)
  
  // カスタマーコードモーダルの状態
  const [isCustomerCodeModalOpen, setIsCustomerCodeModalOpen] = useState(false)
  const [customerCode, setCustomerCode] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  
  // カスタマーコード保存のローディング状態
  const [isSavingCustomerCode, setIsSavingCustomerCode] = useState(false)

  // 商品情報表示設定の初期値
  const [infoSettings, setInfoSettings] = useState<InfoDisplaySettings>({
    showName: true,
    showPrice: true,
    showSize: true,
    showImage: true,
    showCategory: false,
    showAllergies: true,
    showCalories: true,
    showDescription: true,
    showIngredients: false,
    showNutritionInfo: false,
    showShelfLife: false,
    showStorageMethod: false,
  })

  useEffect(() => {
    // 選択された店舗IDを取得
    const storeId = localStorage.getItem("selectedStoreId")
    if (!storeId) {
      // 店舗が選択されていない場合は店舗選択画面に戻る
      router.push("/store-selection")
      return
    }
    setSelectedStoreId(storeId)
    
    // 店舗名を取得
    fetchStoreName(storeId)
    
    // 初期の箱タイプを設定
    fetchInitialBoxType()
    
    // 読み込まれたレイアウトがあるかチェック
    const loadedLayout = localStorage.getItem("loadedLayout")
    if (loadedLayout) {
      try {
        const data = JSON.parse(loadedLayout)
        setBoxSize(data.boxSize)
        setPlacedItems(data.placedItems)
        setInfoSettings(data.infoSettings || infoSettings)
        localStorage.removeItem("loadedLayout") // 使用後は削除
        toast.success("保存されたレイアウトを読み込みました")
      } catch (error) {
        console.error("Failed to load saved layout:", error)
      }
    }
  }, [router])

  const fetchStoreName = async (storeId: string) => {
    try {
      const response = await fetch(`/api/stores/${storeId}`)
      if (response.ok) {
        const store = await response.json()
        setStoreName(store.name)
      }
    } catch (error) {
      console.error("Error fetching store name:", error)
    }
  }

  const fetchInitialBoxType = async () => {
    try {
      const response = await fetch("/api/box-types")
      if (response.ok) {
        const boxTypes = await response.json()
        // 優先: MX9 (最大箱, 45x22) をデフォルトで選択する
        const preferredBoxType = boxTypes.find((bt: BoxType) => bt.size === '45x22' || bt.name === 'MX9')
        if (preferredBoxType) {
          setSelectedBoxType(preferredBoxType)
          setBoxSize(preferredBoxType.size)
        } else {
          // 次に現在の boxSize に合致するものを探す
          const currentBoxType = boxTypes.find((bt: BoxType) => bt.size === boxSize)
          if (currentBoxType) {
            setSelectedBoxType(currentBoxType)
          } else if (boxTypes.length > 0) {
            // 最後に一覧の先頭をフォールバックとして選択
            const firstBoxType = boxTypes[0]
            setSelectedBoxType(firstBoxType)
            setBoxSize(firstBoxType.size)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching initial box type:", error)
    }
  }

  const handleBackToStoreSelection = () => {
    localStorage.removeItem("selectedStoreId")
    router.push("/store-selection")
  }

  const handleSaveLayout = () => {
    const data = JSON.stringify({ boxSize, placedItems, infoSettings, storeId: selectedStoreId }, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    saveAs(blob, `wagashi-layout-${storeName || 'store'}.json`)
  }

  // カスタマーコードで保存する関数
  const handleSaveWithCustomerCode = async () => {
    if (!selectedStoreId || placedItems.length === 0) {
      toast.error("保存するレイアウトがありません")
      return
    }

    setIsSavingCustomerCode(true)
    
    try {
      const response = await fetch("/api/layouts/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId: selectedStoreId,
          storeName,
          boxSize,
          placedItems,
          infoSettings,
          boxTypeId: selectedBoxType?.id || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "保存に失敗しました")
        return
      }

      setCustomerCode(result.customerCode)
      setExpiresAt(result.expiresAt)
      setIsCustomerCodeModalOpen(true)
      toast.success("カスタマーコードで保存しました")

    } catch (error) {
      console.error("Save error:", error)
      toast.error("保存に失敗しました")
    } finally {
      setIsSavingCustomerCode(false)
    }
  }

  const handleLoadLayout = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.boxSize && data.placedItems) {
          setBoxSize(data.boxSize)
          setPlacedItems(data.placedItems)
          if (data.infoSettings) {
            setInfoSettings(data.infoSettings)
          }
        }
      } catch (error) {
        console.error("Invalid file format", error)
      }
    }
    reader.readAsText(file)
  }

  const handleClearLayout = () => {
    if (confirm("詰め合わせをクリアしますか？")) {
      setPlacedItems([])
      // 新しいアイテムのIDトラッキングもクリア
      // BoxAreaコンポーネント内のnewItemIdsもクリアされるように
      // カスタムイベントを発火
      const event = new CustomEvent('clearLayout')
      window.dispatchEvent(event)
    }
  }

  const handleSaveSettings = (newSettings: InfoDisplaySettings) => {
    setInfoSettings(newSettings)
  }

  // 店舗が選択されていない場合は何も表示しない
  if (!selectedStoreId) {
    return null
  }

  // メンテナンスモードが有効で、読み込み完了後の場合はメンテナンス画面を表示
  if (!isMaintenanceLoading && isMaintenanceMode) {
    return (
      <MaintenanceMode
        message={maintenanceMessage}
        estimatedEndTime={estimatedEndTime}
        onRefresh={refetchMaintenanceStatus}
      />
    )
  }

  // 通常のシミュレーター画面を表示（読み込み中も含む）
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="relative">
          {/* 店舗情報とナビゲーション */}
          <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToStoreSelection}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">店舗選択に戻る</span>
                <span className="sm:hidden">戻る</span>
              </Button>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                <Store className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium truncate max-w-[120px] sm:max-w-none">{storeName}</span>
              </div>
            </div>
            
            {/* タイトル */}
            <div className="flex-1 text-center">
              <h1 className="text-sm sm:text-lg font-medium tracking-wider text-gray-800">つめつめ</h1>
            </div>
            
            <div className="w-[120px] sm:w-auto"></div> {/* 右側のスペース調整 */}
          </div>

          <WagashiSimulatorContent
            boxSize={boxSize}
            setBoxSize={setBoxSize}
            placedItems={placedItems}
            setPlacedItems={setPlacedItems}
            isHelpOpen={isHelpOpen}
            setIsHelpOpen={setIsHelpOpen}
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            infoSettings={infoSettings}
            handleSaveLayout={handleSaveLayout}
            handleSaveWithCustomerCode={handleSaveWithCustomerCode}
            handleLoadLayout={handleLoadLayout}
            handleClearLayout={handleClearLayout}
            handleSaveSettings={handleSaveSettings}
            selectedStoreId={selectedStoreId}
            isSavingCustomerCode={isSavingCustomerCode}
            selectedBoxType={selectedBoxType}
            onBoxTypeChange={setSelectedBoxType}
          />

          {/* カスタマーコード保存中のオーバーレイ */}
          {isSavingCustomerCode && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
              <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-indigo)]"></div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    カスタマーコードを生成中...
                  </h3>
                  <p className="text-sm text-gray-600">
                    詰め合わせをデータベースに保存しています
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* カスタマーコードモーダル */}
          <CustomerCodeModal
            isOpen={isCustomerCodeModalOpen}
            onClose={() => setIsCustomerCodeModalOpen(false)}
            customerCode={customerCode}
            expiresAt={expiresAt}
          />
      </div>
    </DndProvider>
  )
}