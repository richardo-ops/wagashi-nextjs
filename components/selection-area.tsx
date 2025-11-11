"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PlacedItem, SweetItem, DividerItem } from "@/types/types"
import SweetItemComponent from "./sweet-item"
import DividerItemComponent from "./divider-item"
import { fetchSweets, fetchDividers } from "@/services/api-service"
import { Loader2, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SelectionAreaProps {
  placedItems: PlacedItem[]
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItem[]>>
  inventoryData?: SweetItem[] // 在庫データを受け取るプロパティを追加
  selectedStoreId: string
}

export default function SelectionArea({ placedItems, setPlacedItems, inventoryData, selectedStoreId }: SelectionAreaProps) {
  const [activeTab, setActiveTab] = useState("餅菓子")
  const [sweets, setSweets] = useState<SweetItem[]>([])
  const [dividers, setDividers] = useState<DividerItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tabsListRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // カテゴリーの配列（動的に生成）
  const getCategories = () => {
    const sweetCategories = [...new Set(sweets.map(sweet => sweet.category))]
    const dividerCategories = ["仕切り"]
    const allCategories = [...sweetCategories, ...dividerCategories]
    console.log("生成されたカテゴリー:", allCategories)
    console.log("商品のカテゴリー一覧:", sweetCategories)
    return allCategories
  }

  // 初期カテゴリー（データ読み込み前用）
  const initialCategories = ["焼き菓子", "餅菓子", "水菓子", "干菓子", "蒸し菓子", "季節限定", "伝統菓子", "和菓子", "洋菓子", "仕切り"]
  
  const categories = sweets.length > 0 ? getCategories() : initialCategories

  console.log("カテゴリー生成 - sweets.length:", sweets.length, "categories:", categories, "activeTab:", activeTab)

  // アクティブタブが存在しないカテゴリーになった場合の処理
  useEffect(() => {
    if (sweets.length > 0 && !categories.includes(activeTab)) {
      const firstCategory = categories.find(cat => cat !== "仕切り") || categories[0]
      setActiveTab(firstCategory)
    }
  }, [categories, activeTab, sweets.length])

  // データ読み込み後に最初のカテゴリーをアクティブにする
  useEffect(() => {
    console.log("データ読み込み後の処理 - sweets.length:", sweets.length, "activeTab:", activeTab, "categories:", categories)
    if (sweets.length > 0 && !activeTab) {
      const firstCategory = categories.find(cat => cat !== "仕切り") || categories[0]
      console.log("最初のカテゴリーを設定:", firstCategory)
      setActiveTab(firstCategory)
    }
  }, [sweets, categories, activeTab])

  // 初期状態でactiveTabを設定
  useEffect(() => {
    if (!activeTab && categories.length > 0) {
      const firstCategory = categories.find(cat => cat !== "仕切り") || categories[0]
      console.log("初期カテゴリーを設定:", firstCategory)
      setActiveTab(firstCategory)
    }
  }, [categories, activeTab])

  // APIからデータを取得
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 店舗別の商品データを取得
      const sweetsResponse = await fetch(`/api/sweets?storeId=${selectedStoreId}`)
      if (!sweetsResponse.ok) {
        throw new Error('商品データの取得に失敗しました')
      }
      const sweetsData = await sweetsResponse.json()

      const dividersData = await fetchDividers()

      console.log("APIから取得した商品データ:", sweetsData)
      console.log("商品データの件数:", sweetsData.length)

      // 在庫データが提供されている場合は、それを使用
      if (inventoryData && inventoryData.length > 0) {
        console.log("在庫データを使用:", inventoryData)
        setSweets(inventoryData)
      } else {
        console.log("APIデータを使用:", sweetsData)
        setSweets(sweetsData)
      }

      setDividers(dividersData)
    } catch (err) {
      console.error("Failed to load data:", err)
      setError("データベースからデータの読み込みに失敗しました。管理画面で商品を追加してください。")
      // エラー時は空の配列を設定
      setSweets([])
      setDividers([])
    } finally {
      setIsLoading(false)
    }
  }

  // 初回マウント時にデータを読み込む
  useEffect(() => {
    loadData()
  }, [inventoryData])

  // 在庫更新イベントのリスナーを追加
  useEffect(() => {
    const handleInventoryUpdate = (event: CustomEvent) => {
      const updatedSweets = event.detail
      if (updatedSweets) {
        setSweets(updatedSweets)
      }
    }

    window.addEventListener("inventoryUpdated", handleInventoryUpdate as EventListener)

    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryUpdate as EventListener)
    }
  }, [])

  // グローバルに保存された在庫データを確認
  useEffect(() => {
    const globalUpdatedSweets = (window as any).updatedSweetsData
    if (globalUpdatedSweets) {
      setSweets(globalUpdatedSweets)
    }
  }, [])

  // タブのスクロール状態を確認する関数
  const checkScrollPosition = () => {
    if (tabsListRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5) // 5pxの余裕を持たせる
    }
  }

  // コンポーネントマウント時とリサイズ時にスクロール状態を確認
  useEffect(() => {
    checkScrollPosition()
    window.addEventListener("resize", checkScrollPosition)
    return () => window.removeEventListener("resize", checkScrollPosition)
  }, [])

  // タブリストがレンダリングされた後にスクロール状態を確認
  useEffect(() => {
    checkScrollPosition()
  }, [tabsListRef.current])

  // 左にスクロールする関数
  const scrollLeft = () => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollBy({ left: -100, behavior: "smooth" })
      setTimeout(checkScrollPosition, 300) // スクロールアニメーション後に状態を更新
    }
  }

  // 右にスクロールする関数
  const scrollRight = () => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollBy({ left: 100, behavior: "smooth" })
      setTimeout(checkScrollPosition, 300) // スクロールアニメーション後に状態を更新
    }
  }

  // 指定したカテゴリに対する検索＋カテゴリフィルタを返すヘルパー
  const getFilteredSweets = (category: string) => {
    const term = searchTerm.trim().toLowerCase()
    return sweets.filter((s) => {
      if (category !== s.category) return false
      if (!term) return true
      // 名前と説明を対象に検索（必要であれば他のフィールドも追加可）
      const inName = s.name?.toLowerCase().includes(term)
      const inDesc = s.description?.toLowerCase().includes(term)
      return inName || inDesc
    })
  }

  const filteredForActiveTab = activeTab ? getFilteredSweets(activeTab) : []

  console.log("現在のアクティブタブ:", activeTab)
  console.log("フィルタリング前の商品数:", sweets.length)
  console.log("検索語:", searchTerm)
  console.log("フィルタリング後(アクティブタブ)の商品数:", filteredForActiveTab.length)

  // 在庫切れの和菓子の数を取得
  const outOfStockCount = filteredForActiveTab.filter((sweet) => !sweet.inStock).length
  const totalCount = filteredForActiveTab.length

  return (
    <div className="w-full lg:w-80 bg-white p-3 sm:p-4 rounded-sm shadow-md flex flex-col h-full border border-[var(--color-indigo-light)]">
      <h2 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4 text-[var(--color-indigo)] tracking-wide flex items-center justify-between">
        <div className="flex items-center">
          <span className="inline-block w-1 h-5 sm:h-6 bg-[var(--color-indigo)] mr-2"></span>
          和菓子選択
        </div>
        <Button
          onClick={loadData}
          size="sm"
          variant="outline"
          className="text-xs px-2 py-1 h-6"
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </h2>

      {/* 検索入力（タブ間で検索語を共有） */}
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="和菓子を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-sm text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[var(--color-indigo)] animate-spin" />
          <span className="ml-2 text-[var(--color-indigo)]">読み込み中...</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-[var(--color-red)] text-center mb-4">
            <p>{error}</p>
          </div>
          <Button
            onClick={loadData}
            className="px-4 py-2 bg-[var(--color-indigo)] text-white rounded-sm hover:bg-[var(--color-indigo-light)] transition-colors relative overflow-hidden group flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-gold)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            再読み込み
          </Button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="relative">
            {/* 左スクロールボタン */}
            {showLeftArrow && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow-md hover:bg-white transition-colors"
                aria-label="左にスクロール"
              >
                <ChevronLeft className="h-5 w-5 text-[var(--color-indigo)]" />
              </button>
            )}

            {/* スクロール可能なタブリスト */}
            <div className="overflow-x-auto scrollbar-hide" ref={tabsListRef} onScroll={checkScrollPosition}>
              <TabsList className="flex min-w-max bg-[var(--color-beige)] p-1">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="px-3 py-1.5 whitespace-nowrap data-[state=active]:bg-[var(--color-indigo)] data-[state=active]:text-white"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* 右スクロールボタン */}
            {showRightArrow && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow-md hover:bg-white transition-colors"
                aria-label="右にスクロール"
              >
                <ChevronRight className="h-5 w-5 text-[var(--color-indigo)]" />
              </button>
            )}
          </div>

          {/* 在庫状況の表示 */}
          {activeTab !== "仕切り" && (
            <div className="mt-2 mb-1 text-xs text-gray-500 flex justify-between items-center">
              <span>
                在庫あり: {totalCount - outOfStockCount}/{totalCount}
              </span>
              {outOfStockCount > 0 && <span className="text-red-500">在庫切れ: {outOfStockCount}種</span>}
            </div>
          )}

          <div className="flex-1 overflow-hidden mt-2">
            {activeTab && categories
              .filter((category) => category !== "仕切り")
              .map((category) => {
                const filteredForCategory = getFilteredSweets(category)
                return (
                  <TabsContent key={category} value={category} className="h-full overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-4 pb-4 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto">
                      {filteredForCategory.length > 0 ? (
                        filteredForCategory.map((sweet) => <SweetItemComponent key={sweet.id} item={sweet} />)
                      ) : (
                        <div className="col-span-2 sm:col-span-3 lg:col-span-2 text-center py-6 sm:py-8 text-gray-500 text-sm">このカテゴリの商品はありません</div>
                      )}
                    </div>
                  </TabsContent>
                )
              })}

            {activeTab && (
              <TabsContent value="仕切り" className="h-full overflow-y-auto pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-4 pb-4 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto">
                  {dividers.length > 0 ? (
                    dividers.map((divider) => <DividerItemComponent key={divider.id} item={divider} />)
                  ) : (
                    <div className="col-span-2 sm:col-span-3 lg:col-span-2 text-center py-6 sm:py-8 text-gray-500 text-sm">仕切りアイテムはありません</div>
                  )}
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      )}
    </div>
  )
}