"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ConfirmComplete from "@/components/confirm-complete"
// 配置済み商品、箱サイズ、箱タイプ、商品情報の型をインポート
import type { PlacedItem, BoxSize, BoxType, Product } from "@/types/types"

type StoredProduct = {
  itemId?: string
  id?: string
  name?: string
  qty?: number
  price?: number
  image?: string
  imageUrl?: string
}

const normalizeProduct = (product: StoredProduct): Product => ({
  id: product.id ?? product.itemId ?? product.name ?? "",
  name: product.name ?? "",
  qty: Number.isFinite(product.qty) && (product.qty ?? 0) > 0 ? Number(product.qty) : 1,
  price: Number(product.price ?? 0),
  image: product.image ?? product.imageUrl ?? "",
})

export default function ConfirmCompletePage() {
  const router = useRouter()
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [boxSize, setBoxSize] = useState<BoxSize>("20x20")
  const [selectedBoxType, setSelectedBoxType] = useState<BoxType | null>(null)
  // sessionStorageから取得した商品情報を格納する状態
  const [products, setProducts] = useState<Product[]>([])
  const [needsNoshi, setNeedsNoshi] = useState(false)
  const [needsBag, setNeedsBag] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      // sessionStorage からデータを取得
      const storedPlacedItems = sessionStorage.getItem("placedItems")
      const storedBoxSize = sessionStorage.getItem("boxSize")
      const storedSelectedBoxType = sessionStorage.getItem("selectedBoxType")
      const storedProducts = sessionStorage.getItem("products")
      const storedNeedsNoshi = sessionStorage.getItem("needsNoshi")
      const storedNeedsBag = sessionStorage.getItem("needsBag")

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
        // sessionStorageから取得した商品情報を正規化して状態にセット
        const parsedProducts = JSON.parse(storedProducts) as StoredProduct[]
        setProducts(parsedProducts.map(normalizeProduct))
      }

      if (storedNeedsNoshi) {
        setNeedsNoshi(JSON.parse(storedNeedsNoshi))
      }

      if (storedNeedsBag) {
        setNeedsBag(JSON.parse(storedNeedsBag))
      }
    } catch (e) {
      console.error("confirm-complete: failed to read sessionStorage", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleBack = () => {
    router.push("/simulator")
  }

  const handleSave = () => {
    // ここで注文データを保存する処理を実装
    console.log("Saving order:", {
      products,
      placedItems,
      boxSize,
      selectedBoxType,
      needsNoshi,
      needsBag,
    })
    alert("ご注文ありがとうございました！")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <ConfirmComplete
      products={products}
      placedItems={placedItems}
      boxSize={boxSize}
      selectedBoxType={selectedBoxType}
      needsNoshi={needsNoshi}
      needsBag={needsBag}
      onBack={handleBack}
      onSave={handleSave}
    />
  )
}
