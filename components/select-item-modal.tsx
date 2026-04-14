// 選択済みの商品を一覧で出すモーダル
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type SelectedItemSummary = {
  itemId?: string
  name: string
  price: number
  imageUrl?: string
  qty: number
}

interface SelectItemModalProps {
  onClose: () => void
  items: SelectedItemSummary[]
  totalPrice: number
}

export default function SelectItemModal({ onClose, items, totalPrice }: SelectItemModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>現在の箱の中身</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--color-indigo-light)] bg-white p-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>アイテム数</span>
              <span>{items.reduce((sum, item) => sum + item.qty, 0)}個</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm text-gray-600">
              <span>合計金額</span>
              <span>{totalPrice.toLocaleString()}円</span>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500">現在、箱の中には商品が配置されていません。</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.itemId || item.name} className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">?</div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-500">単価: {item.price.toLocaleString()}円</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-[var(--color-indigo)]">{item.qty}個</div>
                    <div className="text-xs text-gray-500">小計: {(item.price * item.qty).toLocaleString()}円</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
