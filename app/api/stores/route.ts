import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicCompanyContext } from "@/lib/company-session"

export async function GET() {
  try {
    const context = await getPublicCompanyContext()
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        companyId: context.company.id,
      },
      orderBy: { name: 'asc' }
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