'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { Plus, Edit, Trash2, Users } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  companyId?: string
  companyName?: string
  createdAt: string
  updatedAt: string
}

export default function AccountsPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const isSuperAdmin = session?.user?.role === 'super-admin' || session?.user?.role === 'super_admin'

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/accounts')
      if (!response.ok) throw new Error('管理者の取得に失敗しました')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      setError('管理者の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '操作に失敗しました')
      }

      await fetchUsers()
      resetForm()
    } catch (error) {
      setError(error instanceof Error ? error.message : '操作に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この管理者を削除しますか？')) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/accounts/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '削除に失敗しました')
      }

      await fetchUsers()
    } catch (error) {
      setError(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'admin'
    })
    setEditingUser(null)
    setShowForm(false)
    setError('')
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  if (status === 'loading') {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={isSubmitting} message="処理中..." />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">アカウント管理</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>

      {isSuperAdmin && (
        <Alert>
          <AlertDescription>
            あなたはスーパー管理者です。全アカウントを閲覧・削除できます。
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>新規管理者作成</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名前 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">権限</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理者</SelectItem>
                        {isSuperAdmin && <SelectItem value="super-admin">スーパー管理者</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit">作成</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    権限: {user.role === 'super-admin' || user.role === 'super_admin' ? 'スーパー管理者' : '管理者'}
                  </p>
                  {isSuperAdmin && user.companyName && (
                    <p className="text-xs text-gray-500">会社: {user.companyName}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              管理者が登録されていません
            </h3>
            <p className="text-gray-600">
              最初の管理者を作成してください。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 