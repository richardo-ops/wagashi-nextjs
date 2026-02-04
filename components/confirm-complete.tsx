"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { BoxPreview } from "./confirm-screen"
import type { PlacedItem, BoxSize, BoxType} from "@/types/types"
import type {Product, BagOption} from "@/types/types"
import {BAG_OPTIONS} from "@/types/types"


interface ConfirmCompleteProps {
  products: Product[]
  placedItems: PlacedItem[]
  boxSize: BoxSize
  selectedBoxType?: BoxType | null
  needsNoshi?: boolean
  bagOption?: BagOption
  onBack?: () => void
  onSave?: () => void
}

export default function ConfirmComplete({
  products,
  placedItems,
  boxSize,
  selectedBoxType,
  needsNoshi,
  bagOption,
  onBack,
  onSave,
}: ConfirmCompleteProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = React.useState(false);
  const handleBack = () => {
    setShowDialog(true);
  }
  const handleConfirm = () => {
    // 初期化処理（localStorageやsessionStorageの詰め合わせデータをクリアする場合はここで）
    // 例: localStorage.removeItem('placedItems');
    router.push("/simulator");
    setShowDialog(false);
    if (onBack) onBack();
  }
  const handleCancel = () => {
    setShowDialog(false);
  }
  // 小計（商品合計）
  const productTotal = products.reduce((sum: number, p: Product) => {
    const qty = Number.isFinite(p.qty) ? p.qty : 1 // qty未設定の保険
    return sum + p.price * qty
  }, 0)
  // 箱代（selectedBoxType.priceがあれば加算）
  const boxPrice = selectedBoxType?.price || 0;
  // 袋代
  const selected = BAG_OPTIONS.find(o => o.key === (bagOption ?? 'none')) ?? BAG_OPTIONS[0]
  const bagPrice = selected.price

  // 合計金額
  const totalPrice = productTotal*1.08 + boxPrice + bagPrice;
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center">
  <h1 className="text-4xl font-bold text-orange-500 mb-6 font-rounded">ありがとうございました！</h1>
    <div className="w-full mb-6 flex justify-center">
        <div className="scale-75 transform origin-center">
            <BoxPreview placedItems={placedItems} boxSize={boxSize} />
        </div>
    </div>
        <div className="w-full flex flex-col gap-4 mb-6">
          <div className="bg-gray-100 rounded p-4">
            <div className="font-bold text-2xl mb-4">購入詳細</div>
            <div className="mb-1">商品: {products.map(p => p.name).join(", ") || "なし"}</div>
            <div className="mb-1">箱サイズ: {selectedBoxType?.name || boxSize}</div>
            <div className="mb-1">のし: {needsNoshi ? "あり" : "なし"}</div>
            <div className="mb-1">袋: {selected.label}</div>
            <hr className="my-2 border-gray-300" />
            <div className="mb-1 font-bold text-lg">合計金額: {totalPrice.toLocaleString()}円</div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-2 rounded bg-blue-400 text-white font-bold shadow hover:bg-blue-500"
            onClick={handleBack}
          >
            詰め合わせに戻る
          </button>
        </div>
        {showDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] flex flex-col items-center">
              <div className="mb-4 text-lg font-bold text-gray-800 text-center">
                現在のデータは破棄されますがよろしいですか？
              </div>
              <div className="flex gap-4">
                <button
                  className="px-6 py-2 rounded bg-blue-400 text-white font-bold shadow hover:bg-blue-500"
                  onClick={handleConfirm}
                >
                  はい
                </button>
                <button
                  className="px-6 py-2 rounded bg-gray-300 text-gray-800 font-bold shadow hover:bg-gray-400"
                  onClick={handleCancel}
                >
                  いいえ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}