import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function getCompanyContext() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return null
  }

  const company = await prisma.company.findUnique({
    where: { companyId: session.user.companyId },
  })

  if (!company) {
    return null
  }

  return { session, company }
}

export async function getPublicCompanyContext() {
  const session = await getServerSession(authOptions)
  if (session?.user?.companyId) {
    const company = await prisma.company.findUnique({
      where: { companyId: session.user.companyId },
    })

    if (company) {
      return { session, company }
    }
  }

  const company = await prisma.company.findUnique({
    where: { companyId: 'demo-company' },
  })

  if (!company) {
    return null
  }

  return { session: null, company }
}
