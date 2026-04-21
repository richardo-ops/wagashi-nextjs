"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // メインページにアクセスした場合はログイン画面にリダイレクト
    router.push("/login")
  }, [router])

  return null
}
