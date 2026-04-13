import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCompanyContext } from '@/lib/company-session'

export async function GET() {
  try {
    const context = await getCompanyContext()
    if (!context) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const adminCount = await prisma.adminUser.count({
      where: { companyId: context.company.id }
    })
    const users = await prisma.adminUser.findMany({
      where: { companyId: context.company.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({
      status: 'success',
      adminCount,
      users
    })
  } catch (error) {
    console.error('管理者確認エラー:', error)
    return NextResponse.json({
      status: 'error',
      message: '管理者情報の取得に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}