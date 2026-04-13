import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCompanyContext, getPublicCompanyContext } from "@/lib/company-session"

// 箱タイプ一覧取得
export async function GET() {
  try {
    const context = await getPublicCompanyContext()
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const boxTypes = await prisma.boxType.findMany({
      where: { companyId: context.company.id },
      orderBy: {
        size: "asc",
      },
    })

    return NextResponse.json(boxTypes)
  } catch (error) {
    console.error("Error fetching box types:", error)
    return NextResponse.json(
      { error: "箱タイプの取得に失敗しました" },
      { status: 500 }
    )
  }
}

// 箱タイプ作成
export async function POST(request: Request) {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { size, name, price, description } = await request.json()

    if (!size || !name || price === undefined || price === null) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      )
    }

    const normalizedSize = String(size)
      .trim()
      .replace(/[×＊*xXｘＸ]/g, "x")
      .replace(/\s+/g, "")
    if (!/^\d+(\.\d+)?x\d+(\.\d+)?$/.test(normalizedSize)) {
      return NextResponse.json(
        { error: "サイズは「幅x高さ」の形式で入力してください（例: 22x22）" },
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

    const existingBoxType = await prisma.boxType.findUnique({
      where: {
        companyId_size: {
          companyId: context.company.id,
          size: normalizedSize,
        }
      }
    })

    if (existingBoxType) {
      return NextResponse.json(
        { error: "同じサイズの箱タイプが既に存在します" },
        { status: 400 }
      )
    }

    const boxType = await prisma.boxType.create({
      data: {
        companyId: context.company.id,
        size: normalizedSize,
        name: String(name).trim(),
        price: numericPrice,
        description,
      },
    })

    return NextResponse.json(boxType)
  } catch (error) {
    console.error("Error creating box type:", error)
    return NextResponse.json(
      { error: "箱タイプの作成に失敗しました" },
      { status: 500 }
    )
  }
}