"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Store, MapPin, Phone, Download } from "lucide-react"

interface Store {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  isActive: boolean
}

export default function StoreSelectionPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/stores")
      if (!response.ok) {
        throw new Error("店舗データの取得に失敗しました")
      }
      const data = await response.json()
      setStores(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleStoreSelect = (storeId: string) => {
    // 選択した店舗IDをローカルストレージに保存
    localStorage.setItem("selectedStoreId", storeId)
    // シミュレーター画面に遷移
    router.push("/simulator")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">店舗情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchStores}>再試行</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/icon.png"
              alt="和菓子詰め合わせシミュレーター"
              width={300}
              height={100}
              priority
            />
          </div>
          <p className="text-gray-600 mb-4">
            ご利用になる店舗を選択してください
          </p>
          
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => router.push("/customer-code")}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              カスタマーコードで復元
            </Button>
            <div className="ml-4">{/*ここから8行追加*/}
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
                className="border border-gray-400 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100"
                >
                管理画面へ
              </Button>
            </div>
          </div>
        </div>

        {stores.length === 0 ? (
          <div className="text-center">
            <Store className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">利用可能な店舗がありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Card 
                key={store.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleStoreSelect(store.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    {store.name}
                  </CardTitle>
                  {store.description && (
                    <CardDescription>{store.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {store.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {store.address}
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {store.phone}
                      </div>
                    )}
                  </div>
                  <Button className="w-full mt-4">
                    この店舗を選択
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}