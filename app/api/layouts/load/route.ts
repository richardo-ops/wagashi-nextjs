import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerCode } = body

    if (!customerCode) {
      return NextResponse.json(
        { error: "カスタマーコードが必要です" },
        { status: 400 }
      )
    }

    // カスタマーコードでレイアウトを検索
    const savedLayout = await (prisma as any).savedLayout.findUnique({
      where: { customerCode: customerCode.toUpperCase() },
      include: {
        store: true
      }
    })

    if (!savedLayout) {
      return NextResponse.json(
        { error: "カスタマーコードが見つかりません" },
        { status: 404 }
      )
    }

    // 有効期限をチェック
    if (new Date() > savedLayout.expiresAt) {
      return NextResponse.json(
        { error: "カスタマーコードの有効期限が切れています" },
        { status: 410 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        storeId: savedLayout.storeId,
        storeName: savedLayout.storeName,
        companyId: savedLayout.companyId,
        boxSize: savedLayout.boxSize,
        placedItems: savedLayout.layoutData,
        infoSettings: savedLayout.infoSettings,
        createdAt: savedLayout.createdAt,
        expiresAt: savedLayout.expiresAt
      }
    })

  } catch (error) {
    console.error("Layout load error:", error)
    return NextResponse.json(
      { error: "読み込みに失敗しました" },
      { status: 500 }
    )
  }
}