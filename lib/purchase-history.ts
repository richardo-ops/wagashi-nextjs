// 商品情報の型をインポート
import type { SweetItem } from "@/types/types"
// 購入履歴の型を定義
const PURCHASE_HISTORY_KEY = "wagashi-purchase-history-v1"
// 購入履歴の更新イベント名を定義
export const PURCHASE_HISTORY_UPDATED_EVENT = "wagashi-purchase-history-updated"
// 購入履歴のアイテム情報の型を定義
type PurchaseItemInput = {
  itemId: string
  qty: number
  name?: string
}
// 購入履歴の型を定義
type PurchaseHistory = {
  itemCounts: Record<string, number>
  updatedAt: string | null
}
// 購入履歴の初期値を作成する関数
const createEmptyHistory = (): PurchaseHistory => ({
  itemCounts: {},
  updatedAt: null,
})
// 購入履歴のアイテム数を正規化する関数
const normalizeCountMap = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return {}
  }
  // オブジェクトの各プロパティを数値に変換し、正の数のみを保持する
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((acc, [itemId, count]) => {
    const numericCount = Number(count)
    if (itemId && Number.isFinite(numericCount) && numericCount > 0) {
      acc[itemId] = numericCount
    }
    return acc
  }, {})
}
// 購入履歴を読み込む関数
export const readPurchaseHistory = (): PurchaseHistory => {
  if (typeof window === "undefined") {
    return createEmptyHistory()
  }

  try {
    // localStorageから購入履歴を取得
    const raw = window.localStorage.getItem(PURCHASE_HISTORY_KEY)
    if (!raw) {
      return createEmptyHistory()
    }
    // JSONをパースして購入履歴を取得
    const parsed = JSON.parse(raw) as Partial<PurchaseHistory>
    return {
      itemCounts: normalizeCountMap(parsed.itemCounts),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    }
  } catch (error) {
    console.error("Failed to read purchase history:", error)
    return createEmptyHistory()
  }
}
// 購入履歴を書き込む関数
const writePurchaseHistory = (history: PurchaseHistory) => {
  if (typeof window === "undefined") {
    return
  }
  // localStorageに購入履歴を保存
  window.localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(history))
  window.dispatchEvent(new CustomEvent(PURCHASE_HISTORY_UPDATED_EVENT))
}
// 購入履歴にアイテムを追加する関数
export const recordPurchasedItems = (items: PurchaseItemInput[]) => {
  if (typeof window === "undefined" || items.length === 0) {
    return readPurchaseHistory()
  }

  const currentHistory = readPurchaseHistory()
  const nextCounts = { ...currentHistory.itemCounts }

  items.forEach((item) => {
    const itemId = item.itemId.trim()
    const qty = Number(item.qty)

    if (!itemId || !Number.isFinite(qty) || qty <= 0) {
      return
    }

    nextCounts[itemId] = (nextCounts[itemId] ?? 0) + qty
  })

  const nextHistory: PurchaseHistory = {
    itemCounts: nextCounts,
    updatedAt: new Date().toISOString(),
  }

  try {
    writePurchaseHistory(nextHistory)
  } catch (error) {
    console.error("Failed to save purchase history:", error)
  }

  return nextHistory
}

export const getRecommendedSweets = (sweets: SweetItem[]) => {
  const history = readPurchaseHistory()
  const counts = history.itemCounts

  return [...sweets]
    .filter((sweet) => (sweet.stockQuantity ?? 0) > 0 && (counts[sweet.id] ?? 0) > 0)
    .sort((left, right) => {
      const leftCount = counts[left.id] ?? 0
      const rightCount = counts[right.id] ?? 0

      if (rightCount !== leftCount) {
        return rightCount - leftCount
      }

      return left.name.localeCompare(right.name, "ja")
    })
}
