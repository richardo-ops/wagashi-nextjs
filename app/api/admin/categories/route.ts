import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCompanyContext } from '@/lib/company-session'

// カテゴリー一覧取得
export async function GET() {
  try {
    const context = await getCompanyContext()
    if (!context) {
      console.error('認証エラー: セッションが見つかりません')
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: { companyId: context.company.id },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`カテゴリーデータ取得成功: ${categories.length}件`)
    return NextResponse.json(categories)
  } catch (error) {
    console.error('カテゴリー取得エラー:', error)
    return NextResponse.json({ error: 'カテゴリーの取得に失敗しました' }, { status: 500 })
  }
}

// カテゴリー作成
export async function POST(request: NextRequest) {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'カテゴリー名は必須です' }, { status: 400 })
    }

    const existingCategory = await prisma.category.findUnique({
      where: {
        companyId_name: {
          companyId: context.company.id,
          name,
        }
      }
    })

    if (existingCategory) {
      return NextResponse.json({ error: 'このカテゴリー名は既に存在します' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        companyId: context.company.id,
        name,
        description
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'カテゴリーの作成に失敗しました' }, { status: 500 })
  }
} 