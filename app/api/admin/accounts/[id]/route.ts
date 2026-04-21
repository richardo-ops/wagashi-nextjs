import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { isSuperAdminRole } from '@/lib/auth-utils'

// 管理者削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const superAdmin = isSuperAdminRole(session.user.role)

    // 自分自身を削除しようとしている場合は拒否
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: '自分自身のアカウントは削除できません' },
        { status: 400 }
      )
    }

    // 管理者の存在確認
    const user = await prisma.adminUser.findUnique({
      where: { id: params.id }
    })

    if (!user) {
      return NextResponse.json({ error: '指定された管理者が存在しません' }, { status: 404 })
    }

    if (!superAdmin) {
      const company = await prisma.company.findUnique({
        where: { companyId: session.user.companyId },
      })

      if (!company || user.companyId !== company.id) {
        return NextResponse.json({ error: '指定された管理者が存在しません' }, { status: 404 })
      }
    }

    await prisma.adminUser.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: '管理者を削除しました' })
  } catch (error) {
    return NextResponse.json({ error: '管理者の削除に失敗しました' }, { status: 500 })
  }
} 