import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCompanyContext } from '@/lib/company-session'

// 在庫一覧取得
export async function GET(request: NextRequest) {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: '店舗IDが必要です' }, { status: 400 })
    }

    // 全商品を取得し、該当店舗の在庫情報を含める
    const products = await prisma.product.findMany({
      include: {
        category: true,
        stocks: {
          where: { storeId }
        }
      },
      where: { isActive: true, companyId: context.company.id },
      orderBy: { name: 'asc' }
    })

    // 在庫データの形式に変換（在庫がない商品も含める）
    const stocks = products.map(product => {
      const existingStock = product.stocks[0]
      return {
        id: existingStock?.id || `${product.id}-${storeId}`,
        productId: product.id,
        storeId,
        quantity: existingStock?.quantity || 0,
        product: {
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          category: product.category
        },
        store: { id: storeId, name: '' } // 店舗名は必要に応じて取得
      }
    })

    return NextResponse.json(stocks)
  } catch (error) {
    console.error('Error fetching stocks:', error)
    return NextResponse.json({ error: '在庫の取得に失敗しました' }, { status: 500 })
  }
}

// 在庫更新
export async function PUT(request: NextRequest) {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, storeId, quantity } = body

    if (!productId || !storeId || quantity === undefined) {
      return NextResponse.json({ error: '商品ID、店舗ID、在庫数は必須です' }, { status: 400 })
    }

    if (quantity < 0) {
      return NextResponse.json({ error: '在庫数は0以上である必要があります' }, { status: 400 })
    }

    const stock = await prisma.stock.upsert({
      where: { 
        companyId_productId_storeId: {
          companyId: context.company.id,
          productId,
          storeId
        }
      },
      update: { quantity },
      create: {
        companyId: context.company.id,
        productId,
        storeId,
        quantity
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        store: true
      }
    })

    return NextResponse.json(stock)
  } catch (error) {
    console.error('Error updating stock:', error)
    return NextResponse.json({ error: '在庫の更新に失敗しました' }, { status: 500 })
  }
} 