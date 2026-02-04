"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import type { PlacedItem, BoxSize, BoxType } from "@/types/types"

import type {Product, BagOption} from "@/types/types"
import {BAG_OPTIONS} from "@/types/types"


type Props = {
  products: Product[]
  placedItems?: PlacedItem[]
  boxSize?: BoxSize
  selectedBoxType?: BoxType | null
  activeTabIndex?: number
  onBack?: () => void
  onPurchase?: () => void
}

const formatYen = (n: number) => `¥${n.toLocaleString("ja-JP")}`

// 詰め合わせイメージをレンダリングするコンポーネント
export function BoxPreview({ placedItems, boxSize }: { placedItems: PlacedItem[]; boxSize: BoxSize }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isReady, setIsReady] = useState(false)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !placedItems || placedItems.length === 0) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // グリッドサイズを決定
    const gridMap: Record<BoxSize, number> = {
      "22x22": 220,
      "25.5x22": 255,
      "28.5x22": 285,
      "32.5x22": 325,
      "35x22": 350,
      "37.5x22": 375,
      "39x22": 390,
      "42x22": 420,
      "45x22": 450,
    }
    const gridSize = gridMap[boxSize] || 220
    
    // キャンバスサイズ設定
    const cellSize = 40
    const canvasSize = gridSize * cellSize
    canvas.width = canvasSize
    canvas.height = canvasSize
    
    // 背景（箱）を描画
    ctx.fillStyle = "#f5e6d3"
    ctx.fillRect(0, 0, canvasSize, canvasSize)
    ctx.strokeStyle = "#999"
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, canvasSize, canvasSize)
    
    // グリッドを描画
    ctx.strokeStyle = "#ddd"
    ctx.lineWidth = 0.5
    for (let i = 1; i < gridSize; i++) {
      const pos = i * cellSize
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, canvasSize)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(canvasSize, pos)
      ctx.stroke()
    }
    
    // 配置済みアイテムを描画
    const sweetItems = placedItems.filter(item => item.type === "sweet")
    let loadedCount = 0
    
    const drawAllItems = () => {
      sweetItems.forEach((item) => {
        const x = item.x * cellSize
        const y = item.y * cellSize
        const width = item.width * cellSize
        const height = item.height * cellSize
        
        // 画像を読み込んで描画（グローバルの Image コンストラクタを使用）
        const imageElement = document.createElement("img")
        imageElement.crossOrigin = "anonymous"
        imageElement.onload = () => {
          // 画像を描画
          ctx.drawImage(imageElement, x, y, width, height)
          loadedCount++
        }
        imageElement.onerror = () => {
          // 画像読み込み失敗時は背景色で矩形を描画
          ctx.fillStyle = "#fff9f0"
          ctx.fillRect(x, y, width, height)
          ctx.strokeStyle = "#daa520"
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, width, height)
          
          // テキストで商品名を表示
          ctx.fillStyle = "#333"
          ctx.font = "12px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          const text = item.name.substring(0, 6)
          ctx.fillText(text, x + width / 2, y + height / 2)
          loadedCount++
        }
        imageElement.src = item.imageUrl
      })
    }
    
    drawAllItems()
    setIsReady(true)
  }, [placedItems, boxSize])
  
  if (!placedItems || placedItems.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-500 text-sm">イメージなし</p>
      </div>
    )
  }
  
  return <canvas ref={canvasRef} className="w-full h-auto border border-gray-200 rounded-md" />
}

export default function ConfirmScreen({
  products,
  placedItems = [],
  boxSize = "22x22",
  selectedBoxType = null,
  activeTabIndex = 0,
  onBack,
  onPurchase,
}: Props) {
  // Propsの分割代入は関数引数のみでOK

  const [activeTab, setActiveTab] = useState<number>(activeTabIndex)
  const [needsNoshi, setNeedsNoshi] = useState<boolean>(false)
  //const [needsBag, setNeedsBag] = useState<boolean>(false)
  const [bagOption, setBagOption] = React.useState<BagOption>('none')
  const [isComplete, setIsComplete] = useState<boolean>(false)
  
  // 選択中の袋価格を取り出し
  const selectedBag = BAG_OPTIONS.find(o => o.key === bagOption) ?? BAG_OPTIONS[0]
  const bagPrice = selectedBag.price

  const boxPrice = selectedBoxType?.price || 0
  
  // 小計（商品合計）
  const productTotal = products.reduce((sum: number, p: Product) => {
    const qty = Number.isFinite(p.qty) ? p.qty : 1 // qty未設定の保険
    return sum + p.price * qty
  }, 0)

  const total = productTotal*1.08 + boxPrice + bagPrice
  const tabs = ["商品", "アレルゲン", "のし", "袋"]

  if (isComplete) {
    const ConfirmComplete = require("./confirm-complete.tsx").default
    return (
      <ConfirmComplete
        products={products}
        placedItems={placedItems}
        boxSize={boxSize}
        selectedBoxType={selectedBoxType}
        needsNoshi={needsNoshi}
        bagOption={bagOption}
        onBack={() => setIsComplete(false)}
        onSave={() => alert("データ保存処理（実装例）")}
      />
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm p-6">
        {/* header: back + title + tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              aria-label="戻る"
            >
              <span className="text-2xl">‹</span>
              <span className="text-sm">もどる</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">完成予想図</h1>
          </div>

          <div>
            <nav className="flex items-end gap-2" role="tablist" aria-label="確認タブ">
              {tabs.map((t, i) => (
                <div key={t} className="flex flex-col items-center">
                  <button
                    role="tab"
                    aria-selected={i === activeTab}
                    aria-controls={`tab-panel-${i}`}
                    id={`tab-${i}`}
                    onClick={() => setActiveTab(i)}
                    className={`px-4 py-1 rounded-t-md text-sm font-medium focus:outline-none ${
                      i === activeTab ? "bg-blue-400 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {t}
                  </button>
                  {i === activeTab ? <div className="h-1 w-full bg-blue-400 rounded-b-md" /> : <div className="h-1 w-full" />}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* main area */}
        <div className="md:flex md:gap-6">
          {/* left:詰め合わせプレビュー（またはボックスイメージ） */}
          <div className="flex-shrink-0 w-full md:w-1/2">
            <div className="w-full bg-gray-50 border border-gray-200 rounded-md h-72 md:h-96 flex items-center justify-center p-4">
              {placedItems && placedItems.length > 0 ? (
                <BoxPreview placedItems={placedItems} boxSize={boxSize} />
              ) : (
                <BoxPreview placedItems={[]} boxSize={boxSize} />
              )}
            </div>
          </div>

          {/* right: dynamic content */}
          <div className="mt-4 md:mt-0 md:flex-1 flex flex-col">
            {/* 商品タブ */}
            <section
              id="tab-panel-0"
              role="tabpanel"
              aria-labelledby="tab-0"
              hidden={activeTab !== 0}
            >
              <h2 className="text-lg font-extrabold text-gray-900 mb-4">商品内容</h2>

              {products.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>商品が選択されていません</p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto mb-4">
                  <ul className="space-y-3">
                    {products.map((p) => (
                      <li key={p.id} className="flex items-center justify-between">
                        <div className="text-gray-900 text-base font-medium">{p.name} <span className="text-sm font-normal text-gray-600">- {p.qty}個入り</span></div>
                        <div className="text-gray-900 text-base font-semibold">{formatYen(p.price)}</div>
                      </li>
                    ))}
                  </ul>
                  {/* 箱代 */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-900 text-base font-medium">箱代 ({selectedBoxType?.name || boxSize})</div>
                      <div className="text-gray-900 text-base font-semibold">{formatYen(boxPrice)}</div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* アレルゲンタブ */}
            <section
              id="tab-panel-1"
              role="tabpanel"
              aria-labelledby="tab-1"
              hidden={activeTab !== 1}
            >
              <h2 className="text-lg font-extrabold text-gray-900 mb-3">アレルゲン情報</h2>
              <div className="text-sm text-gray-700 mb-2">各商品のアレルゲン情報（モック）</div>
              <ul className="space-y-2">
                {products.map((p) => (
                  <li key={p.id} className="flex items-start justify-between bg-gray-50 p-3 rounded">
                    <div>
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-sm text-gray-600">アレルゲン: なし</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* のしタブ */}
            <section
              id="tab-panel-2"
              role="tabpanel"
              aria-labelledby="tab-2"
              hidden={activeTab !== 2}
            >
              <h2 className="text-lg font-extrabold text-gray-900 mb-3">のし</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="noshi"
                      checked={needsNoshi}
                      onChange={() => setNeedsNoshi(true)}
                    />
                    <span className="ml-2 text-sm">必要</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="noshi"
                      checked={!needsNoshi}
                      onChange={() => setNeedsNoshi(false)}
                    />
                    <span className="ml-2 text-sm">不要</span>
                  </label>
                </div>
                <div className="text-sm text-gray-600 mt-3">選択: {needsNoshi ? "必要" : "不要"}</div>
              </div>
            </section>

            
      {/* 袋タブ */}
      <section
        id="tab-panel-3"
        role="tabpanel"
        aria-labelledby="tab-3"
        hidden={activeTab !== 3}
      >
        <h2 className="text-lg font-extrabold text-gray-900 mb-3">袋オプション</h2>

        <div className="flex flex-wrap items-center gap-6">
          {BAG_OPTIONS.map((opt) => (
            <label key={opt.key} className="inline-flex items-center">
              <input
                type="radio"
                name="bag-option"
                value={opt.key}
                checked={bagOption === opt.key}
                onChange={() => setBagOption(opt.key)}
              />
              <span className="ml-2 text-sm">
                {opt.label}
                {opt.price > 0 ? ` (+${formatYen(opt.price)})` : ''}
              </span>
            </label>
          ))}
        </div>

        <div className="text-sm text-gray-600 mt-3">
          選択: {selectedBag.label}
          {selectedBag.price > 0 ? ` (+${formatYen(selectedBag.price)})` : ''}
        </div>
      </section>


            
          {/* 共通の合計と購入ボタン */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">

            {/* 左側：明細（箱代・袋代） */}
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
              {/* 箱代 */}
              <div className="flex items-center justify-between">
                <div className="text-gray-900 text-base font-medium">
                  箱代（{selectedBoxType?.name || boxSize}）
                </div>
                <div className="text-gray-900 text-base font-semibold">
                  {formatYen(boxPrice)}
                </div>
              </div>

              {/* 袋代（選択内容を表示） */}
              <div className="flex items-center justify-between">
                <div className="text-gray-900 text-base font-medium">
                  袋（{selectedBag.label}）
                </div>
                <div className="text-gray-900 text-base font-semibold">
                  {formatYen(bagPrice)}
                </div>
              </div>
            </div>

            {/* 右側：合計金額 */}
            <div>
              <div className="text-sm text-gray-700">合計金額</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {formatYen(total)}
              </div>
            </div>

            {/* 購入ボタン */}
            <div>
              <button
                onClick={() => setIsComplete(true)}
                className="px-6 py-2 rounded-full bg-gradient-to-tr from-blue-400 to-blue-500 text-white font-semibold shadow"
              >
                購入
              </button>
            </div>
          </div>

          </div>
        </div>
      </div>
    </div>
  )
}