import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCompanyContext } from "@/lib/company-session"

export async function GET() {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const stores = await prisma.store.findMany({
      where: { companyId: context.company.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(stores)
  } catch (error) {
    console.error("Error fetching stores:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function POST(request: Request) {
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

    const store = await prisma.store.create({
      data: {
        companyId: context.company.id,
        name,
        description: description || null,
        address: address || null,
        phone: phone || null,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error("Error creating store:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}