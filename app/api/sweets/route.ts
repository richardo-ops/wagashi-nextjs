import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { compareJapaneseStrings } from "@/lib/utils"
import type { SweetItem } from "@/types/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return new NextResponse(JSON.stringify({ error: "Store ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // データベースから商品データを取得（店舗別在庫情報を含む）
    const products = await prisma.product.findMany({
      include: {
        category: true,
        stocks: {
          where: {
            storeId: storeId
          }
        }
      },
      where: {
        isActive: true
      }
    })

    products.sort((left, right) => {
      const nameComparison = compareJapaneseStrings(left.name, right.name)
      if (nameComparison !== 0) {
        return nameComparison
      }

      return compareJapaneseStrings(left.id, right.id)
    })

    // SweetItemの形式に変換
    const sweets: SweetItem[] = products.map(product => {
      // サイズを幅と高さに分割
      const [width, height] = product.size.split('x').map(Number)
      
      // アレルギー情報を配列に変換
      const allergies = product.allergyInfo ? product.allergyInfo.split(',').map(a => a.trim()) : []
      
      // 該当店舗の在庫情報を取得
      const storeStock = product.stocks.find(stock => stock.storeId === storeId)
      
      return {
        id: product.id,
        name: product.name,
        category: product.category.name as any, // カテゴリー名をそのまま使用
        width,
        height,
        price: product.price,
        imageUrl: product.beforeImagePath || "/placeholder.svg",
        placedImageUrl: product.afterImagePath || product.beforeImagePath || "/placeholder.svg",
        enlargedImagePath: product.enlargedImagePath || undefined,
        allergies,
        calories: product.calories || undefined,
        description: product.description || undefined,
        inStock: (storeStock?.quantity || 0) > 0,
        stockQuantity: storeStock?.quantity || 0,
        // 管理画面で管理されている追加項目
        ingredients: product.ingredients || undefined,
        nutritionInfo: product.nutritionInfo || undefined,
        shelfLife: product.shelfLife || undefined,
        storageMethod: product.storageMethod || undefined
      }
    })

    return NextResponse.json(sweets)
  } catch (error) {
    console.error("Error in sweets API route:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// キャッシュクリア用のPOSTメソッド
export async function POST() {
  try {
    // このエンドポイントは、管理画面から変更時に呼び出される
    // クライアント側で商品変更通知イベントを発火
    return NextResponse.json({ 
      message: "Cache clear request received",
      event: "productUpdate"
    })
  } catch (error) {
    console.error("Error in sweets POST route:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
