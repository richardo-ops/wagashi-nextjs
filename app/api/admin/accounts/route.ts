import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { isSuperAdminRole } from '@/lib/auth-utils'

// 管理者一覧取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const superAdmin = isSuperAdminRole(session.user.role)
    const company = superAdmin
      ? null
      : await prisma.company.findUnique({
          where: { companyId: session.user.companyId },
        })

    if (!superAdmin && !company) {
      return NextResponse.json({ error: '会社情報が見つかりません' }, { status: 404 })
    }

    const users = await prisma.adminUser.findMany({
      where: superAdmin ? undefined : { companyId: company!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            companyId: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users.map((user) => ({
      ...user,
      companyId: user.company.companyId,
      companyName: user.company.name,
    })))
  } catch (error) {
    return NextResponse.json({ error: '管理者の取得に失敗しました' }, { status: 500 })
  }
}

// 管理者作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const company = await prisma.company.findUnique({
      where: { companyId: session.user.companyId },
    })

    if (!company) {
      return NextResponse.json({ error: '会社情報が見つかりません' }, { status: 404 })
    }

    const body = await request.json()
    const { email, password, name, role = 'admin' } = body
    const superAdmin = isSuperAdminRole(session.user.role)
    const normalizedRole = role === 'super-admin' && superAdmin ? 'super-admin' : 'admin'

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'メールアドレス、パスワード、名前は必須です' }, { status: 400 })
    }

    if (role === 'super-admin' && !superAdmin) {
      return NextResponse.json({ error: 'スーパー管理者のみスーパー管理者を作成できます' }, { status: 403 })
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.adminUser.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'このメールアドレスは既に使用されています' }, { status: 400 })
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: normalizedRole,
        companyId: company.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '管理者の作成に失敗しました' }, { status: 500 })
  }
} 