import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicCompanyContext } from "@/lib/company-session"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getPublicCompanyContext()
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const store = await prisma.store.findUnique({
      where: {
        id: params.id,
        isActive: true,
        companyId: context.company.id,
      }
    })

    if (!store) {
      return new NextResponse(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return NextResponse.json(store)
  } catch (error) {
    console.error("Error fetching store:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}