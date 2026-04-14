import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// 管理者一覧取得
export async function GET() {
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

    const users = await prisma.adminUser.findMany({
      where: { companyId: company.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
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

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'メールアドレス、パスワード、名前は必須です' }, { status: 400 })
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
        role,
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