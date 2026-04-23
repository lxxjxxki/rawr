'use client'

import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { getMyBookmarks } from '@/lib/api'
import ArticleGrid from '@/components/ArticleGrid'
import type { ArticleResponse } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'

export default function BookmarksPage() {
  const { user } = useUIStore()
  const [articles, setArticles] = useState<ArticleResponse[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getMyBookmarks()
      .then(setArticles)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <h1 className="text-white uppercase tracking-[0.3em] text-sm font-bold mb-10">Sign In</h1>
          <div className="flex flex-col gap-4 w-64">
            <a
              href={`${API_BASE}/oauth2/authorization/google`}
              className="block py-3 px-6 bg-white text-black uppercase text-xs font-bold tracking-widest hover:bg-accent transition-colors text-center"
            >
              Continue with Google
            </a>
            <a
              href={`${API_BASE}/oauth2/authorization/kakao`}
              className="block py-3 px-6 bg-[#FEE500] text-black uppercase text-xs font-bold tracking-widest hover:opacity-90 transition-opacity text-center"
            >
              Continue with Kakao
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-20">
      <h1 className="text-center text-white uppercase tracking-[0.3em] text-lg font-bold py-8 border-b border-zinc-800">
        Bookmarks
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <p className="text-zinc-600 uppercase tracking-widest text-sm">Loading...</p>
        </div>
      ) : (
        <ArticleGrid articles={articles} />
      )}
    </div>
  )
}
