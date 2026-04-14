import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, FolderOpen, BarChart3, Users } from 'lucide-react'
import { getCompanyContext } from '@/lib/company-session'

export default async function AdminDashboard() {
  const context = await getCompanyContext()
  if (!context) {
    return null
  }

  const [productCount, categoryCount, stockCount, userCount] = await Promise.all([
    prisma.product.count({ where: { companyId: context.company.id } }),
    prisma.category.count({ where: { companyId: context.company.id } }),
    prisma.stock.count({ where: { companyId: context.company.id } }),
    prisma.adminUser.count({ where: { companyId: context.company.id } }),
  ])

  const stats = [
    {
      title: '商品数',
      value: productCount,
      icon: Package,
      description: '登録済み商品'
    },
    {
      title: 'カテゴリー数',
      value: categoryCount,
      icon: FolderOpen,
      description: '商品カテゴリー'
    },
    {
      title: '在庫管理',
      value: stockCount,
      icon: BarChart3,
      description: '在庫登録商品'
    },
    {
      title: '管理者数',
      value: userCount,
      icon: Users,
      description: '登録管理者'
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-600">和菓子シミュレーター管理画面へようこそ</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近の活動</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              管理画面の機能をご利用ください。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/admin/products/new"
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                → 新商品を追加
              </a>
              <a
                href="/admin/categories/new"
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                → 新カテゴリーを追加
              </a>
              <a
                href="/admin/stock"
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                → 在庫を確認・更新
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 