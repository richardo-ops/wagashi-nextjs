import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { normalizeCompanyId } from '@/lib/company'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, companyName } = body

    if (!email || !password || !name || !companyName) {
      return NextResponse.json(
        { error: 'メールアドレス、パスワード、名前、会社名は必須です' },
        { status: 400 }
      )
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedName = String(name).trim()
    const normalizedCompanyName = String(companyName).trim()
    const normalizedCompanyId = normalizeCompanyId(normalizedCompanyName)

    if (!normalizedCompanyId) {
      return NextResponse.json(
        { error: '会社名から会社IDを生成できませんでした' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      )
    }

    const existingCompany = await prisma.company.findUnique({
      where: { companyId: normalizedCompanyId },
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'この会社名は既に使用されています' },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
      data: {
        companyId: normalizedCompanyId,
        name: normalizedCompanyName,
      },
    })

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.adminUser.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: normalizedName,
        role: 'admin',
        companyId: company.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: {
          select: {
            companyId: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        ...user,
        companyId: user.company.companyId,
        companyName: user.company.name,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'アカウント作成に失敗しました' },
      { status: 500 }
    )
  }
}
