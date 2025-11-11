'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { Plus, Edit, Trash2, Upload, Search, Image as ImageIcon, X } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  price: number
  categoryId: string
  description?: string
  allergyInfo?: string
  calories?: number
  size: string
  beforeImagePath?: string
  afterImagePath?: string
  enlargedImagePath?: string
  ingredients?: string
  nutritionInfo?: string
  shelfLife?: string
  storageMethod?: string
  isActive: boolean
  category: Category
  stocks?: {
    id: string
    quantity: number
    storeId: string
  }[]
}

export default function ProductsPage() {
  const { data: session, status } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // 代表的なアレルギー項目
  const allergyOptions = [
    '小麦', '卵', '乳', '落花生', 'アーモンド', 'あわび', 'いか', 'いくら', 'オレンジ', 'カシューナッツ',
    'キウイフルーツ', '牛肉', 'くるみ', 'ごま', 'さけ', 'さば', '大豆', '鶏肉', 'バナナ', '豚肉',
    'まつたけ', 'もも', 'やまいも', 'りんご', 'ゼラチン', 'エビ', 'カニ'
  ]
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
    allergyInfo: '',
    calories: '',
    size: '',
    beforeImagePath: '',
    afterImagePath: '',
    enlargedImagePath: '',
    ingredients: '',
    nutritionInfo: '',
    shelfLife: '',
    storageMethod: ''
  })
  
  // 選択されたアレルギー項目を管理
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    } else if (status === 'unauthenticated') {
      setError('認証が必要です。ログインしてください。')
      setIsLoading(false)
    }
    // status が 'loading' の場合は何もしない（読み込み中のまま）
  }, [status])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories')
      ])
      
      if (!productsRes.ok) {
        const errorData = await productsRes.json()
        throw new Error(`商品データの取得に失敗しました: ${errorData.error || productsRes.statusText}`)
      }
      
      if (!categoriesRes.ok) {
        const errorData = await categoriesRes.json()
        throw new Error(`カテゴリーデータの取得に失敗しました: ${errorData.error || categoriesRes.statusText}`)
      }
      
      const [productsData, categoriesData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json()
      ])
      
      setProducts(productsData)
      setCategories(categoriesData)
      setError('') // エラーをクリア
    } catch (error) {
      console.error('データ取得エラー:', error)
      setError(error instanceof Error ? error.message : 'データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File, type: 'before' | 'after' | 'enlarged') => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('画像のアップロードに失敗しました')
      }
      
      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        [`${type}ImagePath`]: data.imageUrl
      }))
    } catch (error) {
      setError('画像のアップロードに失敗しました')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products'
      
      const method = editingProduct ? 'PUT' : 'POST'
      
      // 選択されたアレルギー項目を文字列に変換
      const allergyInfoString = selectedAllergies.join(', ')
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          allergyInfo: allergyInfoString
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '操作に失敗しました')
      }

      await fetchData()
      resetForm()
    } catch (error) {
      setError(error instanceof Error ? error.message : '操作に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この商品を削除しますか？')) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '削除に失敗しました')
      }

      await fetchData()
    } catch (error) {
      setError(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      categoryId: product.categoryId,
      description: product.description || '',
      allergyInfo: product.allergyInfo || '',
      calories: product.calories?.toString() || '',
      size: product.size,
      beforeImagePath: product.beforeImagePath || '',
      afterImagePath: product.afterImagePath || '',
      enlargedImagePath: product.enlargedImagePath || '',
      ingredients: product.ingredients || '',
      nutritionInfo: product.nutritionInfo || '',
      shelfLife: product.shelfLife || '',
      storageMethod: product.storageMethod || ''
    })
    // 既存のアレルギー情報を配列に変換
    const existingAllergies = product.allergyInfo ? product.allergyInfo.split(',').map(item => item.trim()) : []
    setSelectedAllergies(existingAllergies)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      categoryId: '',
      description: '',
      allergyInfo: '',
      calories: '',
      size: '',
      beforeImagePath: '',
      afterImagePath: '',
      enlargedImagePath: '',
      ingredients: '',
      nutritionInfo: '',
      shelfLife: '',
      storageMethod: ''
    })
    setSelectedAllergies([])
    setEditingProduct(null)
    setShowForm(false)
    setError('')
  }

  // フィルタリングされた商品を取得
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // カテゴリー別に商品をグループ化
  const productsByCategory = categories.reduce((acc, category) => {
    const categoryProducts = filteredProducts.filter(product => product.categoryId === category.id)
    if (categoryProducts.length > 0) {
      acc[category.id] = categoryProducts
    }
    return acc
  }, {} as Record<string, Product[]>)

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex justify-center items-center p-8">
        <Alert variant="destructive">
          <AlertDescription>
            認証が必要です。ログインしてください。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={isSubmitting} message="処理中..." />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">商品管理</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 検索機能（フォームが表示されていない時のみ表示） */}
      {!showForm && (
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="商品名、説明、カテゴリーで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4"
            />
          </div>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProduct ? '商品編集' : '新規商品作成'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">商品名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">価格 (円) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoryId">カテゴリー *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="size">サイズ *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="size-width"
                      type="number"
                      min="1"
                      max="10"
                      placeholder="幅"
                      value={formData.size.split('x')[0] || ''}
                      onChange={(e) => {
                        const width = e.target.value
                        const height = formData.size.split('x')[1] || ''
                        setFormData({ ...formData, size: `${width}x${height}` })
                      }}
                      className="w-20"
                      required
                    />
                    <span className="text-gray-500">×</span>
                    <Input
                      id="size-height"
                      type="number"
                      min="1"
                      max="10"
                      placeholder="高さ"
                      value={formData.size.split('x')[1] || ''}
                      onChange={(e) => {
                        const width = formData.size.split('x')[0] || ''
                        const height = e.target.value
                        setFormData({ ...formData, size: `${width}x${height}` })
                      }}
                      className="w-20"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">サイズは1×1から10×10の範囲で入力してください</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">商品詳細</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">カロリー (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>アレルギー情報</Label>
                <div className="space-y-4">
                  {/* 選択されたアレルギー項目の表示 */}
                  {selectedAllergies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedAllergies.map((allergy) => (
                        <Badge key={allergy} variant="secondary" className="flex items-center gap-1">
                          {allergy}
                          <button
                            type="button"
                            onClick={() => setSelectedAllergies(prev => prev.filter(item => item !== allergy))}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* アレルギー項目の選択 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {allergyOptions.map((allergy) => {
                      const isSelected = selectedAllergies.includes(allergy)
                      return (
                        <button
                          key={allergy}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAllergies(prev => prev.filter(item => item !== allergy))
                            } else {
                              setSelectedAllergies(prev => [...prev, allergy])
                            }
                          }}
                          style={{
                            padding: '12px',
                            fontSize: '14px',
                            borderWidth: '2px',
                            borderRadius: '8px',
                            fontWeight: '500',
                            position: 'relative',
                            transition: 'all 0.2s',
                            ...(isSelected ? {
                              backgroundColor: '#dbeafe',
                              borderColor: '#3b82f6',
                              color: '#1e40af',
                              cursor: 'pointer',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            } : {
                              backgroundColor: '#ffffff',
                              borderColor: '#d1d5db',
                              color: '#000000',
                              cursor: 'pointer'
                            })
                          }}
                          className={isSelected ? 'hover:bg-blue-200' : 'hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {isSelected && (
                              <div 
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  backgroundColor: '#3b82f6',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <div 
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '50%'
                                  }}
                                ></div>
                              </div>
                            )}
                            {allergy}
                          </div>
                          {isSelected && (
                            <div 
                              style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#2563eb',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '12px'
                              }}
                            >
                              ✓
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    該当するアレルギー項目をクリックして選択してください。選択した項目は上に表示され、×ボタンで削除できます。
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ingredients">原材料名</Label>
                <Textarea
                  id="ingredients"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  rows={2}
                  placeholder="例: 小麦粉、砂糖、卵、牛乳..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nutritionInfo">栄養成分表示</Label>
                <Textarea
                  id="nutritionInfo"
                  value={formData.nutritionInfo}
                  onChange={(e) => setFormData({ ...formData, nutritionInfo: e.target.value })}
                  rows={3}
                  placeholder="例: エネルギー: 200kcal、たんぱく質: 5g、脂質: 8g、炭水化物: 30g..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shelfLife">日持ち</Label>
                  <Input
                    id="shelfLife"
                    value={formData.shelfLife}
                    onChange={(e) => setFormData({ ...formData, shelfLife: e.target.value })}
                    placeholder="例: 製造日から3日間"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storageMethod">保存方法</Label>
                  <Input
                    id="storageMethod"
                    value={formData.storageMethod}
                    onChange={(e) => setFormData({ ...formData, storageMethod: e.target.value })}
                    placeholder="例: 冷蔵保存"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>配置前画像</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={formData.beforeImagePath}
                      onChange={(e) => setFormData({ ...formData, beforeImagePath: e.target.value })}
                      placeholder="画像URL"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'before')
                      }}
                      className="hidden"
                      id="before-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('before-image-upload')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* 配置前画像プレビュー */}
                  {formData.beforeImagePath && (
                    <div className="mt-2">
                      <div className="relative inline-block">
                        <img
                          src={formData.beforeImagePath}
                          alt="配置前画像プレビュー"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, beforeImagePath: '' })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>配置後画像</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={formData.afterImagePath}
                      onChange={(e) => setFormData({ ...formData, afterImagePath: e.target.value })}
                      placeholder="画像URL"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'after')
                      }}
                      className="hidden"
                      id="after-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('after-image-upload')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* 配置後画像プレビュー */}
                  {formData.afterImagePath && (
                    <div className="mt-2">
                      <div className="relative inline-block">
                        <img
                          src={formData.afterImagePath}
                          alt="配置後画像プレビュー"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, afterImagePath: '' })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>拡大用画像</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={formData.enlargedImagePath}
                      onChange={(e) => setFormData({ ...formData, enlargedImagePath: e.target.value })}
                      placeholder="画像URL"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'enlarged')
                      }}
                      className="hidden"
                      id="enlarged-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('enlarged-image-upload')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* 拡大用画像プレビュー */}
                  {formData.enlargedImagePath && (
                    <div className="mt-2">
                      <div className="relative inline-block">
                        <img
                          src={formData.enlargedImagePath}
                          alt="拡大用画像プレビュー"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, enlargedImagePath: '' })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit">
                  {editingProduct ? '更新' : '作成'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 商品一覧（フォームが表示されていない時のみ表示） */}
      {!showForm && (
        <>
          {/* カテゴリータブ */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex min-w-full">
                <TabsTrigger value="all" className="whitespace-nowrap">すべて ({filteredProducts.length})</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id} className="whitespace-nowrap">
                    {category.name} ({productsByCategory[category.id]?.length || 0})
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* 商品画像 */}
                        <div className="flex-shrink-0">
                          {product.beforeImagePath ? (
                            <img
                              src={product.beforeImagePath}
                              alt={product.name}
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* 商品情報 */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{product.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">{product.category.name}</Badge>
                                <Badge variant="outline">{product.size}</Badge>
                                <span className="text-lg font-semibold text-green-600">
                                  ¥{product.price.toLocaleString()}
                                </span>
                              </div>
                              {product.description && (
                                <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                              )}
                              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                {product.calories && (
                                  <span>カロリー: {product.calories}kcal</span>
                                )}
                                {product.allergyInfo && (
                                  <span>アレルギー: {product.allergyInfo}</span>
                                )}
                                {product.stocks && (
                                  <span>在庫: {stock.quantity}個</span>
                                )}
                              </div>
                              {(product.ingredients || product.nutritionInfo || product.shelfLife || product.storageMethod) && (
                                <div className="mt-2 text-xs text-gray-400">
                                  {product.ingredients && <div>原材料: {product.ingredients}</div>}
                                  {product.shelfLife && <div>日持ち: {product.shelfLife}</div>}
                                  {product.storageMethod && <div>保存方法: {product.storageMethod}</div>}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-6">
                <div className="grid gap-4">
                  {productsByCategory[category.id]?.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* 商品画像 */}
                          <div className="flex-shrink-0">
                            {product.beforeImagePath ? (
                              <img
                                src={product.beforeImagePath}
                                alt={product.name}
                                className="w-20 h-20 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* 商品情報 */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{product.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary">{product.category.name}</Badge>
                                  <Badge variant="outline">{product.size}</Badge>
                                  <span className="text-lg font-semibold text-green-600">
                                    ¥{product.price.toLocaleString()}
                                  </span>
                                </div>
                                {product.description && (
                                  <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                                )}
                                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                  {product.calories && (
                                    <span>カロリー: {product.calories}kcal</span>
                                  )}
                                  {product.allergyInfo && (
                                    <span>アレルギー: {product.allergyInfo}</span>
                                  )}
                                  {product.stock && (
                                    <span>在庫: {product.stock.quantity}個</span>
                                  )}
                                </div>
                                {(product.ingredients || product.nutritionInfo || product.shelfLife || product.storageMethod) && (
                                  <div className="mt-2 text-xs text-gray-400">
                                    {product.ingredients && <div>原材料: {product.ingredients}</div>}
                                    {product.shelfLife && <div>日持ち: {product.shelfLife}</div>}
                                    {product.storageMethod && <div>保存方法: {product.storageMethod}</div>}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  )
} 