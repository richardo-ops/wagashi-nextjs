'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  Home, 
  Package, 
  FolderOpen, 
  Users, 
  BarChart3, 
  LogOut,
  Settings,
  ExternalLink,
  Store
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'ダッシュボード', href: '/admin', icon: Home },
  { name: '商品管理', href: '/admin/products', icon: Package },
  { name: 'カテゴリー管理', href: '/admin/categories', icon: FolderOpen },
  { name: '箱タイプ管理', href: '/admin/box-types', icon: Package },
  { name: '店舗管理', href: '/admin/stores', icon: Store },
  { name: '在庫管理', href: '/admin/stock', icon: BarChart3 },
  { name: 'アカウント管理', href: '/admin/accounts', icon: Users },
  { name: '設定', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: false 
    })
    router.push('/login')
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-lg">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-xl font-bold text-gray-900">管理画面</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>


      <div className="border-t p-4 space-y-2">
        {/* 店舗選択ページへのリンク（同タブ） */}
        <Link
          href="/store-selection"
          className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <Store className="mr-3 h-5 w-5 text-gray-400" />
          店舗選択へ
        </Link>
      </div>

      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400" />
          ログアウト
        </button>
      </div>
    </div>
  )
} 