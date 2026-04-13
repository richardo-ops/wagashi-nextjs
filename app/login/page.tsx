'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingOverlay } from '@/components/ui/loading-overlay'

export default function AdminLogin() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('名前を入力してください')
          return
        }

        if (!companyName.trim()) {
          setError('会社名を入力してください')
          return
        }

        if (password.length < 8) {
          setError('パスワードは8文字以上で入力してください')
          return
        }

        if (password !== confirmPassword) {
          setError('確認用パスワードが一致しません')
          return
        }

        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            companyName,
            email,
            password,
          }),
        })

        const registerResult = await registerResponse.json()

        if (!registerResponse.ok) {
          setError(registerResult.error || 'アカウント作成に失敗しました')
          return
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else {
        router.push('/admin')
      }
    } catch (error) {
      setError(mode === 'register' ? 'アカウント作成中にエラーが発生しました' : 'ログイン中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <LoadingOverlay isLoading={isLoading} message="ログイン中..." />
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'login' ? '管理画面ログイン' : '管理アカウント作成'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'login' ? '和菓子シミュレーター管理画面' : '新規管理者アカウントを登録します'}
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'login' ? '管理者認証' : 'アカウント情報'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">名前</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === 'register'}
                    placeholder="管理者名"
                  />
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="company-name">会社名</Label>
                  <Input
                    id="company-name"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required={mode === 'register'}
                    placeholder="会社名を入力"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="パスワードを入力"
                />
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">パスワード（確認）</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={mode === 'register'}
                    placeholder="パスワードを再入力"
                  />
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading
                  ? mode === 'login'
                    ? 'ログイン中...'
                    : '作成中...'
                  : mode === 'login'
                    ? 'ログイン'
                    : 'アカウント作成'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={switchMode}
                disabled={isLoading}
              >
                {mode === 'login' ? '新規アカウントを作成' : 'ログイン画面に戻る'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 