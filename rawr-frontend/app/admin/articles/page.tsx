'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import { deleteArticle, getMyArticles } from '@/lib/api'
import type { ArticleResponse } from '@/types'

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getMyArticles()
      .then(setArticles)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(article: ArticleResponse) {
    if (!confirm(`"${article.title}" 삭제? (복구 가능합니다.)`)) return
    setPendingId(article.id)
    try {
      await deleteArticle(article.id)
      setArticles((prev) => prev.filter((a) => a.id !== article.id))
    } catch {
      // ignore
    } finally {
      setPendingId(null)
    }
  }

  return (
    <AdminGuard allow={['OWNER', 'CONTRIBUTOR']}>
      <div className="pt-20 max-w-4xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-white uppercase tracking-[0.3em] text-sm font-bold">My Articles</h1>
          <div className="flex gap-3">
            <Link
              href="/admin/articles/deleted"
              className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest transition-colors"
            >
              Deleted
            </Link>
            <Link
              href="/admin/articles/new"
              className="bg-accent text-black px-4 py-2 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
            >
              + New
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-zinc-600 uppercase tracking-widest text-xs">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-zinc-600 uppercase tracking-widest text-xs">No articles yet</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-800">
            {articles.map((a) => (
              <div key={a.id} className="py-4 flex gap-4 items-center">
                {a.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverImage} alt="" className="w-16 h-16 object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-accent text-[10px] uppercase tracking-widest font-bold">
                    {a.category} · {a.status}
                  </p>
                  <p className="text-white font-bold mt-1 truncate">{a.title}</p>
                  <p className="text-zinc-600 text-xs mt-1">
                    Updated {new Date(a.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs uppercase tracking-widest">
                  <Link href={`/admin/articles/${a.slug}/edit`} className="text-white hover:text-accent transition-colors">
                    Edit
                  </Link>
                  <Link href={`/admin/articles/${a.slug}/revisions`} className="text-zinc-500 hover:text-white transition-colors">
                    History
                  </Link>
                  <button
                    onClick={() => handleDelete(a)}
                    disabled={pendingId === a.id}
                    className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
