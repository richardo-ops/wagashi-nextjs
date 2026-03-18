import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

// Noto Sans JPフォントの設定
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
})

// Noto Serif JPフォントの設定
const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif-jp",
  display: "swap",
})

// フォールバック用のInterフォント
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "つめつめ",
  description: "詰め合わせをシミュレーションできるWebアプリケーション",
  generator: 'v0.dev',
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${notoSerifJP.variable} ${inter.variable}`}>
      <body className="washi-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
