import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCompanyContext } from "@/lib/company-session"

// 箱タイプ詳細取得
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const boxType = await prisma.boxType.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!boxType || boxType.companyId !== context.company.id) {
      return NextResponse.json(
        { error: "箱タイプが見つかりません" },
        { status: 404 }
      )
    }

    return NextResponse.json(boxType)
  } catch (error) {
    console.error("Error fetching box type:", error)
    return NextResponse.json(
      { error: "箱タイプの取得に失敗しました" },
      { status: 500 }
    )
  }
}

// 箱タイプ更新
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { name, price, description, isActive } = await request.json()

    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        { error: "名前と価格は必須です" },
        { status: 400 }
      )
    }

    const numericPrice = parseInt(String(price), 10)
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { error: "価格は0以上の整数で入力してください" },
        { status: 400 }
      )
    }

    const currentBoxType = await prisma.boxType.findUnique({ where: { id: params.id } })
    if (!currentBoxType || currentBoxType.companyId !== context.company.id) {
      return NextResponse.json({ error: "箱タイプが見つかりません" }, { status: 404 })
    }

    const boxType = await prisma.boxType.update({
      where: {
        id: params.id,
      },
      data: {
        name: String(name).trim(),
        price: numericPrice,
        description,
        isActive,
      },
    })

    return NextResponse.json(boxType)
  } catch (error) {
    console.error("Error updating box type:", error)
    return NextResponse.json(
      { error: "箱タイプの更新に失敗しました" },
      { status: 500 }
    )
  }
}

// 箱タイプ削除
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const currentBoxType = await prisma.boxType.findUnique({ where: { id: params.id } })
    if (!currentBoxType || currentBoxType.companyId !== context.company.id) {
      return NextResponse.json({ error: "箱タイプが見つかりません" }, { status: 404 })
    }

    await prisma.boxType.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: "箱タイプを削除しました" })
  } catch (error) {
    console.error("Error deleting box type:", error)
    return NextResponse.json(
      { error: "箱タイプの削除に失敗しました" },
      { status: 500 }
    )
  }
}