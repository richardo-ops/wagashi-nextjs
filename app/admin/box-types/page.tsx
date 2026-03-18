"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Package, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { BoxType, BoxSize } from "@/types/types"

const boxSizeOptions: BoxSize[] = [
  "22x22",
  "25.5x22",
  "28.5x22",
  "32.5x22",
  "35x22",
  "37.5x22",
  "39x22",
  "42x22",
  "45x22"
]

export default function BoxTypesPage() {
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBoxType, setEditingBoxType] = useState<BoxType | null>(null)
  const [formData, setFormData] = useState({
    size: "" as BoxSize | "",
    name: "",
    price: "",
    description: "",
    isActive: true,
  })

  useEffect(() => {
    fetchBoxTypes()
  }, [])

  const fetchBoxTypes = async () => {
    try {
      const response = await fetch("/api/box-types")
      if (response.ok) {
        const data = await response.json()
        setBoxTypes(data)
      } else {
        toast.error("箱タイプの取得に失敗しました")
      }
    } catch (error) {
      console.error("Error fetching box types:", error)
      toast.error("箱タイプの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.size || !formData.name || !formData.price) {
      toast.error("必須項目を入力してください")
      return
    }

    try {
      const response = await fetch("/api/box-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("箱タイプを作成しました")
        setIsCreateModalOpen(false)
        resetForm()
        fetchBoxTypes()
      } else {
        const error = await response.json()
        toast.error(error.error || "作成に失敗しました")
      }
    } catch (error) {
      console.error("Error creating box type:", error)
      toast.error("作成に失敗しました")
    }
  }

  const handleEdit = async () => {
    if (!editingBoxType || !formData.name || !formData.price) {
      toast.error("必須項目を入力してください")
      return
    }

    try {
      const response = await fetch(`/api/box-types/${editingBoxType.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          price: formData.price,
          description: formData.description,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        toast.success("箱タイプを更新しました")
        setIsEditModalOpen(false)
        setEditingBoxType(null)
        resetForm()
        fetchBoxTypes()
      } else {
        const error = await response.json()
        toast.error(error.error || "更新に失敗しました")
      }
    } catch (error) {
      console.error("Error updating box type:", error)
      toast.error("更新に失敗しました")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この箱タイプを削除しますか？")) {
      return
    }

    try {
      const response = await fetch(`/api/box-types/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("箱タイプを削除しました")
        fetchBoxTypes()
      } else {
        const error = await response.json()
        toast.error(error.error || "削除に失敗しました")
      }
    } catch (error) {
      console.error("Error deleting box type:", error)
      toast.error("削除に失敗しました")
    }
  }

  const openEditModal = (boxType: BoxType) => {
    setEditingBoxType(boxType)
    setFormData({
      size: boxType.size,
      name: boxType.name,
      price: boxType.price.toString(),
      description: boxType.description || "",
      isActive: boxType.isActive,
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      size: "",
      name: "",
      price: "",
      description: "",
      isActive: true,
    })
  }

  const getSizeLabel = (size: BoxSize) => {
    switch (size) {
      case "22x22":
        return "22×22cm"
      case "25.5x22":
        return "25.5×22cm"
      case "28.5x22":
        return "28.5×22cm"
      case "32.5x22":
        return "32.5×22cm"
      case "35x22":
        return "35×22cm"
      case "37.5x22":
        return "37.5×22cm"
      case "39x22":
        return "39×22cm"
      case "42x22":
        return "42×22cm"
      case "45x22":
        return "45×22cm"
      default:
        return size
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">箱タイプ管理</h1>
          <p className="text-gray-600">詰め合わせ箱のタイプを管理します</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              新規作成
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>箱タイプを作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="size">サイズ *</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => setFormData({ ...formData, size: value as BoxSize })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="サイズを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {boxSizeOptions.map((size) => (
                      <SelectItem key={size} value={size}>{getSizeLabel(size)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">名前 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: 小箱"
                />
              </div>
              <div>
                <Label htmlFor="price">価格 *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="例: 500"
                />
              </div>
              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="箱の説明を入力"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">有効</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreate}>作成</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {boxTypes.map((boxType) => (
          <Card key={boxType.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{boxType.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getSizeLabel(boxType.size)}
                  </Badge>
                  <Badge variant={boxType.isActive ? "default" : "secondary"}>
                    {boxType.isActive ? "有効" : "無効"}
                  </Badge>
                </div>
              </div>
              <CardDescription>
                {boxType.description || "説明なし"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-blue-600">
                  ¥{boxType.price.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(boxType)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  編集
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(boxType.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {boxTypes.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">箱タイプがありません</h3>
          <p className="text-gray-600 mb-4">最初の箱タイプを作成してください</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            箱タイプを作成
          </Button>
        </div>
      )}

      {/* 編集モーダル */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>箱タイプを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>サイズ</Label>
              <div className="p-2 bg-gray-100 rounded">
                {getSizeLabel(formData.size as BoxSize)}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-name">名前 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: 小箱"
              />
            </div>
            <div>
              <Label htmlFor="edit-price">価格 *</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="例: 500"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">説明</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="箱の説明を入力"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">有効</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleEdit}>更新</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}