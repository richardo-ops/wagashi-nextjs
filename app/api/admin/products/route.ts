import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compareJapaneseStrings } from '@/lib/utils'
import { getCompanyContext } from '@/lib/company-session'

// 商品一覧取得
export async function GET() {
  try {
    const context = await getCompanyContext()
    if (!context) {
      console.error('認証エラー: セッションが見つかりません')
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        stocks: true
      },
      where: { companyId: context.company.id }
    })

    products.sort((left, right) => {
      const nameComparison = compareJapaneseStrings(left.name, right.name)
      if (nameComparison !== 0) {
        return nameComparison
      }

      return compareJapaneseStrings(left.id, right.id)
    })

    console.log(`商品データ取得成功: ${products.length}件`)
    return NextResponse.json(products)
  } catch (error) {
    console.error('商品取得エラー:', error)
    return NextResponse.json({ error: '商品の取得に失敗しました' }, { status: 500 })
  }
}

// 商品作成
export async function POST(request: NextRequest) {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      price,
      categoryId,
      description,
      allergyInfo,
      calories,
      size,
      beforeImagePath,
      afterImagePath,
      enlargedImagePath,
      ingredients,
      nutritionInfo,
      shelfLife,
      storageMethod
    } = body

    if (!name || !price || !categoryId || !size) {
      return NextResponse.json(
        { error: '商品名、価格、カテゴリー、サイズは必須です' },
        { status: 400 }
      )
    }

    // サイズのバリデーション
    const sizeMatch = size.match(/^(\d+)x(\d+)$/)
    if (!sizeMatch) {
      return NextResponse.json(
        { error: 'サイズは「幅x高さ」の形式で入力してください（例: 3x4）' },
        { status: 400 }
      )
    }

    const width = parseInt(sizeMatch[1])
    const height = parseInt(sizeMatch[2])

    if (width < 1 || width > 10 || height < 1 || height > 10) {
      return NextResponse.json(
        { error: 'サイズは1×1から10×10の範囲で入力してください' },
        { status: 400 }
      )
    }

    // カテゴリーの存在確認
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category || category.companyId !== context.company.id) {
      return NextResponse.json({ error: '指定されたカテゴリーが存在しません' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        companyId: context.company.id,
        name,
        price: parseInt(price),
        categoryId,
        description,
        allergyInfo,
        calories: calories ? parseInt(calories) : null,
        size,
        beforeImagePath,
        afterImagePath,
        enlargedImagePath,
        ingredients,
        nutritionInfo,
        shelfLife,
        storageMethod
      },
      include: {
        category: true
      }
    })

    // 各店舗の初期在庫レコードを作成
    const stores = await prisma.store.findMany({
      where: { companyId: context.company.id },
      select: { id: true }
    })

    if (stores.length > 0) {
      await prisma.stock.createMany({
        data: stores.map((store) => ({
          companyId: context.company.id,
          productId: product.id,
          storeId: store.id,
          quantity: 0,
        })),
      })
    }

    // シミュレーション画面のキャッシュクリアを通知
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sweets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Failed to notify cache clear:', error)
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('商品作成エラー:', error)
    return NextResponse.json({ error: '商品の作成に失敗しました' }, { status: 500 })
  }
} 