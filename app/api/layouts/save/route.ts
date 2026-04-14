import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Prismaクライアントのクリーンアップ
if (process.env.NODE_ENV === "production") {
    process.on("beforeExit", async () => {
        await prisma.$disconnect()
    })
}

// カスタマーコードを生成する関数
function generateCustomerCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { storeId, storeName, boxSize, placedItems, infoSettings, boxTypeId } = body

        if (!storeId || !storeName || !boxSize || !placedItems) {
            return NextResponse.json(
                { error: "必要なデータが不足しています" },
                { status: 400 }
            )
        }

        const store = await (prisma as any).store.findUnique({
            where: { id: storeId }
        })

        if (!store) {
            return NextResponse.json(
                { error: "店舗が見つかりません" },
                { status: 404 }
            )
        }

        // ユニークなカスタマーコードを生成
        let customerCode = ""
        let isUnique = false
        let attempts = 0
        const maxAttempts = 10

        do {
            customerCode = generateCustomerCode()
            const existing = await (prisma as any).savedLayout.findUnique({
                where: { customerCode }
            })
            isUnique = !existing
            attempts++
        } while (!isUnique && attempts < maxAttempts)

        if (!isUnique) {
            return NextResponse.json(
                { error: "カスタマーコードの生成に失敗しました" },
                { status: 500 }
            )
        }

        // 30日後の有効期限を設定
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        // データベースに保存
        const savedLayout = await (prisma as any).savedLayout.create({
            data: {
                customerCode,
                companyId: store.companyId,
                storeId,
                storeName,
                boxSize,
                boxTypeId: boxTypeId || null,
                layoutData: placedItems,
                infoSettings: infoSettings || {},
                expiresAt
            }
        })

        return NextResponse.json({
            success: true,
            customerCode,
            expiresAt: savedLayout.expiresAt
        })

    } catch (error) {
        console.error("Layout save error:", error)
        return NextResponse.json(
            { error: "保存に失敗しました" },
            { status: 500 }
        )
    }
}