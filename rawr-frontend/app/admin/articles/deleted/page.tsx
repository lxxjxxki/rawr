'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import { getMyDeletedArticles, restoreArticle } from '@/lib/api'
import type { ArticleResponse } from '@/types'

export default function DeletedArticlesPage() {
  const [articles, setArticles] = useState<ArticleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getMyDeletedArticles()
      .then(setArticles)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRestore(article: ArticleResponse) {
    setPendingId(article.id)
    try {
      await restoreArticle(article.id)
      setArticles((prev) => prev.filter((a) => a.id !== article.id))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <AdminGuard allow={['OWNER', 'CONTRIBUTOR']}>
      <div className="pt-20 max-w-4xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-white uppercase tracking-[0.3em] text-sm font-bold">Deleted Articles</h1>
          <Link
            href="/admin/articles"
            className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest transition-colors"
          >
            Back
          </Link>
        </div>

        {loading ? (
          <p className="text-zinc-600 uppercase tracking-widest text-xs">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-zinc-600 uppercase tracking-widest text-xs">No deleted articles</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-800">
            {articles.map((a) => (
              <div key={a.id} className="py-4 flex gap-4 items-center">
                {a.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverImage} alt="" className="w-16 h-16 object-cover flex-shrink-0 opacity-50" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest">
                    {a.category}
                  </p>
                  <p className="text-zinc-300 font-bold mt-1 truncate">{a.title}</p>
                </div>
                <button
                  onClick={() => handleRestore(a)}
                  disabled={pendingId === a.id}
                  className="text-xs uppercase tracking-widest text-accent hover:opacity-80 transition-opacity disabled:opacity-40 flex-shrink-0"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
