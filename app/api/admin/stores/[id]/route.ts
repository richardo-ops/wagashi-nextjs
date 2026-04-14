import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCompanyContext } from "@/lib/company-session"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, address, phone, isActive } = body

    if (!name) {
      return new NextResponse(JSON.stringify({ error: "店舗名は必須です" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const currentStore = await prisma.store.findUnique({ where: { id: params.id } })
    if (!currentStore || currentStore.companyId !== context.company.id) {
      return new NextResponse(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    const store = await prisma.store.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        address: address || null,
        phone: phone || null,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error("Error updating store:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // 店舗に関連する在庫データがある場合は削除できない
    const stockCount = await prisma.stock.count({
      where: { storeId: params.id, companyId: context.company.id }
    })

    const currentStore = await prisma.store.findUnique({ where: { id: params.id } })
    if (!currentStore || currentStore.companyId !== context.company.id) {
      return new NextResponse(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (stockCount > 0) {
      return new NextResponse(JSON.stringify({ 
        error: "この店舗には在庫データが存在するため削除できません" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    await prisma.store.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "店舗を削除しました" })
  } catch (error) {
    console.error("Error deleting store:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}