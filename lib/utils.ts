//ユティリティ関数
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// 日本語の文字列を正しく比較するためのCollatorを作成
const japaneseCollator = new Intl.Collator("ja", {
  numeric: true,
  sensitivity: "base"
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function compareJapaneseStrings(left: string, right: string) {
  return japaneseCollator.compare(left.normalize("NFKC"), right.normalize("NFKC"))
}
