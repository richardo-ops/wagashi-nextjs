"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ConfirmScreen from "@/components/confirm-screen"
import type { PlacedItem, BoxSize, BoxType } from "@/types/types"

export default function ConfirmPage() {
  const router = useRouter()
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [boxSize, setBoxSize] = useState<BoxSize>("20x20")
  const [selectedBoxType, setSelectedBoxType] = useState<BoxType | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      // sessionStorage からデータを取得
      const storedPlacedItems = sessionStorage.getItem("placedItems")
      const storedBoxSize = sessionStorage.getItem("boxSize")
      const storedSelectedBoxType = sessionStorage.getItem("selectedBoxType")
      const storedProducts = sessionStorage.getItem("products")

      if (storedPlacedItems) {
        setPlacedItems(JSON.parse(storedPlacedItems))
      }

      if (storedBoxSize) {
        setBoxSize(storedBoxSize as BoxSize)
      }

      if (storedSelectedBoxType) {
        setSelectedBoxType(JSON.parse(storedSelectedBoxType))
      }

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts))
      }
    } catch (e) {
      console.error("confirm: failed to read sessionStorage", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleBack = () => {
    router.back()
  }

  const handlePurchase = () => {
    // 確定画面へ遷移
    router.push("/confirm-complete")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <ConfirmScreen
      products={products}
      placedItems={placedItems}
      boxSize={boxSize}
      selectedBoxType={selectedBoxType}
      activeTabIndex={0}
      onBack={handleBack}
      onPurchase={handlePurchase}
    />
  )
}
