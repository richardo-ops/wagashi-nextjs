"use client"

import { useEffect, useRef, useState } from "react"
import type { PlacedItem, SweetItem, NoshiInfo } from "@/types/types"
import type { BoxSize } from "@/types/types"
import type { InfoDisplaySettings } from "@/components/info-settings-modal"
import { fetchSweets } from "@/services/api-service"

interface PrintLayoutProps {
  placedItems: PlacedItem[]
  boxSize: BoxSize
  title: string
  includeItemList: boolean
  includePrice: boolean
  includeAllergies: boolean
  noshiInfo: NoshiInfo
  infoSettings: InfoDisplaySettings
  isPrintPreview: boolean
  selectedStoreId: string
}

export default function PrintLayout({
  placedItems,
  boxSize,
  title,
  includeItemList,
  includePrice,
  includeAllergies,
  noshiInfo,
  infoSettings,
  isPrintPreview,
  selectedStoreId,
}: PrintLayoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [width, height] = boxSize.split("x").map(Number)
  const cellSize = isPrintPreview ? 25 : 40 // プレビューのサイズを少し大きく
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [sweets, setSweets] = useState<SweetItem[]>([])

  // 和菓子のみをフィルタリング
  const sweetItems = placedItems.filter((item) => item.type === "sweet")
  // 仕切りのみをフィルタリング
  const dividerItems = placedItems.filter((item) => item.type === "divider")

  // 合計金額を計算
  const sweetsSubtotal = sweetItems.reduce((total, item) => total + (item.price || 0), 0)
  const sweetsWithTax = sweetsSubtotal * 1.08
  const boxAmount = (boxPrice || 0)
  const totalPrice = Math.floor(sweetsWithTax + boxAmount)

  // sweetsデータを取得
  useEffect(() => {
    const loadSweets = async () => {
      try {
        const sweetsData = await fetchSweets(selectedStoreId)
        setSweets(sweetsData)
      } catch (error) {
        console.error("Failed to load sweets for print:", error)
        setSweets([])
      }
    }
    loadSweets()
  }, [selectedStoreId])

  // キャンバスの初期化と背景・グリッド線の描画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // キャンバスのサイズを設定
    canvas.width = width * cellSize
    canvas.height = height * cellSize

    // 背景を描画
    ctx.fillStyle = "#FFF7E6" // 薄い琥珀色の背景
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // グリッド線を描画
    ctx.strokeStyle = "#E9D8BE"
    ctx.lineWidth = 1

    // 縦線
    for (let i = 0; i <= width; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, canvas.height)
      ctx.stroke()
    }

    // 横線
    for (let i = 0; i <= height; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(canvas.width, i * cellSize)
      ctx.stroke()
    }

    // 枠線を描画
    ctx.strokeStyle = "#92400E"
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // 和菓子の描画は別のuseEffectで行う（画像の読み込みを待つため）
  }, [width, height, cellSize, isPrintPreview])

  // テキストを複数行に分割して描画する関数
  const drawMultilineText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number,
    fontSize: number
  ) => {
    ctx.font = `${fontSize}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const words = text.split("")
    const lines: string[] = []
    let currentLine = ""

    // 文字を1文字ずつチェックして行に分割
    for (const char of words) {
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine !== "") {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }

    // 行数が多すぎる場合は文字サイズを小さくして再試行
    const lineHeight = fontSize * 1.2
    const totalHeight = lines.length * lineHeight
    
    if (totalHeight > maxHeight && fontSize > 8) {
      return drawMultilineText(ctx, text, x, y, maxWidth, maxHeight, fontSize - 2)
    }

    // 各行を描画
    const startY = y - (totalHeight / 2) + (lineHeight / 2)
    lines.forEach((line, index) => {
      ctx.fillText(line, x, startY + index * lineHeight)
    })
  }

  // 和菓子の描画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let hasStartedDrawing = false

    // すべての和菓子を描画
    const drawAllSweets = () => {
      if (hasStartedDrawing) return
      hasStartedDrawing = true

      // 和菓子の背景と枠線を先に描画
      sweetItems.forEach((sweet) => {
        // 和菓子の背景
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(sweet.x * cellSize, sweet.y * cellSize, sweet.width * cellSize, sweet.height * cellSize)

        // 和菓子の枠線
        ctx.strokeStyle = "#D4A76A"
        ctx.lineWidth = 1
        ctx.strokeRect(sweet.x * cellSize, sweet.y * cellSize, sweet.width * cellSize, sweet.height * cellSize)

        // 和菓子の名前を複数行で表示
        ctx.fillStyle = "#92400E"
        const textMaxWidth = sweet.width * cellSize - 8 // パディングを考慮
        const textMaxHeight = sweet.height * cellSize - 8 // パディングを考慮
        const baseFontSize = Math.max(8, Math.min(cellSize / 3, 16)) // 最小8px、最大16px
        
        drawMultilineText(
          ctx,
          sweet.name,
          (sweet.x + sweet.width / 2) * cellSize,
          (sweet.y + sweet.height / 2) * cellSize,
          textMaxWidth,
          textMaxHeight,
          baseFontSize
        )
      })

      // 仕切りを描画（和菓子の上に描画するため、和菓子の描画後に行う）
      dividerItems.forEach((divider) => {
        ctx.fillStyle = "#92400E" // 琥珀色の濃い色

        if (divider.orientation === "horizontal") {
          ctx.fillRect(divider.x * cellSize, divider.y * cellSize - 1, divider.width * cellSize, 2)
        } else {
          ctx.fillRect(divider.x * cellSize - 1, divider.y * cellSize, 2, divider.height * cellSize)
        }
      })

      setIsCanvasReady(true)
    }

    // プレビュー時は画像も表示、印刷時は商品名のみ表示
    if (isPrintPreview) {
      // プレビュー時：画像の読み込みを待つ
      const totalImages = sweetItems.filter(item => item.imageUrl).length
      let loadedImages = 0

      if (totalImages === 0) {
        drawAllSweets()
        return
      }

      // 各和菓子の画像を読み込んで描画
      sweetItems.forEach((sweet) => {
        if (!sweet.imageUrl) {
          return
        }

        const img = new Image()
        img.crossOrigin = "anonymous" // CORS対策
        img.src = sweet.imageUrl

        img.onload = () => {
          ctx.save()

          // クリッピング領域を設定（商品枠内に画像を制限）
          ctx.beginPath()
          ctx.rect(sweet.x * cellSize, sweet.y * cellSize, sweet.width * cellSize, sweet.height * cellSize)
          ctx.clip()

          // 回転がある場合は適用
          if (sweet.rotation) {
            const centerX = (sweet.x + sweet.width / 2) * cellSize
            const centerY = (sweet.y + sweet.height / 2) * cellSize

            ctx.translate(centerX, centerY)
            ctx.rotate((sweet.rotation * Math.PI) / 180)
            ctx.translate(-centerX, -centerY)
          }

          // 画像をセルサイズに合わせて描画
          const aspectRatio = img.width / img.height
          const cellWidth = sweet.width * cellSize
          const cellHeight = sweet.height * cellSize
          
          let drawWidth = cellWidth
          let drawHeight = cellHeight

          // アスペクト比を維持しつつ、セル内に収まるようにサイズ調整
          if (aspectRatio > cellWidth / cellHeight) {
            // 横長の画像の場合、幅を基準にする
            drawHeight = drawWidth / aspectRatio
          } else {
            // 縦長の画像の場合、高さを基準にする
            drawWidth = drawHeight * aspectRatio
          }

          // 中央に配置
          const offsetX = (cellWidth - drawWidth) / 2
          const offsetY = (cellHeight - drawHeight) / 2

          ctx.drawImage(
            img, 
            sweet.x * cellSize + offsetX, 
            sweet.y * cellSize + offsetY, 
            drawWidth, 
            drawHeight
          )

          ctx.restore()

          // 読み込んだ画像をカウント
          loadedImages++
          if (loadedImages >= totalImages) {
            drawAllSweets()
          }
        }

        img.onerror = () => {
          // 画像の読み込みに失敗した場合もカウント
          loadedImages++
          if (loadedImages >= totalImages) {
            drawAllSweets()
          }
        }
      })

      // 一定時間後に強制的に描画開始（画像読み込みのタイムアウト）
      const timeoutId = setTimeout(() => {
        if (!hasStartedDrawing) {
          drawAllSweets()
        }
      }, 2000)

      return () => clearTimeout(timeoutId)
    } else {
      // 印刷時：商品名のみ表示（画像は読み込まない）
      drawAllSweets()
    }
  }, [sweetItems, dividerItems, cellSize, isPrintPreview])

  // アレルギー情報を取得する関数
  const getAllergies = (itemId: string): string[] => {
    const sweet = sweets.find((s) => s.id === itemId)
    return sweet?.allergies || []
  }

  // 全てのアレルギー情報を集約
  const allAllergies = new Set<string>()
  sweetItems.forEach((item) => {
    const allergies = getAllergies(item.itemId)
    allergies.forEach((allergy) => allAllergies.add(allergy))
  })

  return (
    <div className={`print-layout ${isPrintPreview ? "print-preview" : ""}`}>
      <div className="print-header">
        <h1 className="print-title">{title}</h1>
        <div className="print-date">作成日: {new Date().toLocaleDateString("ja-JP")}</div>
      </div>

      {noshiInfo.enabled && (noshiInfo.upperText || noshiInfo.lowerText) && (
        <div className="print-noshi">
          <div className="noshi-container">
            <div className="noshi-decoration">
              <div className="noshi-ribbon"></div>
            </div>
            <div className="noshi-text">
              {noshiInfo.upperText && (
                <div className="noshi-upper-text">{noshiInfo.upperText}</div>
              )}
              {noshiInfo.lowerText && (
                <div className="noshi-lower-text">{noshiInfo.lowerText}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="print-box-container">
        <canvas ref={canvasRef} className={`print-canvas ${isCanvasReady ? "opacity-100" : "opacity-70"}`} />
        {!isCanvasReady && <div className="print-canvas-loading">描画中...</div>}
      </div>

      {includePrice && (
        <div className="print-total-price">
          <span>合計金額: </span>
          <span className="price">{totalPrice.toLocaleString()}円</span>
        </div>
      )}

      {includeAllergies && allAllergies.size > 0 && (
        <div className="print-allergies">
          <h3>アレルギー情報</h3>
          <div className="allergy-tags">
            {Array.from(allAllergies).map((allergy, index) => (
              <span key={index} className="allergy-tag">
                {allergy}
              </span>
            ))}
          </div>
        </div>
      )}

      {includeItemList && sweetItems.length > 0 && (
        <div className="print-item-list">
          <h3>商品リスト</h3>
          <table>
            <thead>
              <tr>
                <th>商品名</th>
                {includePrice && <th>価格</th>}
                {includeAllergies && <th>アレルギー</th>}
              </tr>
            </thead>
            <tbody>
              {sweetItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  {includePrice && <td>{item.price?.toLocaleString() || 0}円</td>}
                  {includeAllergies && (
                    <td>{getAllergies(item.itemId).length > 0 ? getAllergies(item.itemId).join(", ") : "なし"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="print-footer">
        <p>和菓子詰め合わせシミュレーター</p>
      </div>
    </div>
  )
}
