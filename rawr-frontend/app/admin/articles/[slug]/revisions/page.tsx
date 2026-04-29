'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminGuard from '@/components/AdminGuard'
import { getArticleBySlug, getArticleRevisions, revertArticle } from '@/lib/api'
import type { ArticleResponse, ArticleRevisionResponse } from '@/types'

interface Props {
  params: { slug: string }
}

export default function ArticleRevisionsPage({ params }: Props) {
  const router = useRouter()
  const [article, setArticle] = useState<ArticleResponse | null>(null)
  const [revisions, setRevisions] = useState<ArticleRevisionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getArticleBySlug(params.slug)
      .then(async (a) => {
        setArticle(a)
        const revs = await getArticleRevisions(a.id)
        setRevisions(revs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.slug])

  async function handleRevert(rev: ArticleRevisionResponse) {
    if (!article) return
    if (!confirm(`이 시점(${new Date(rev.savedAt).toLocaleString()})으로 되돌립니까? 현재 내용은 새 revision으로 저장됩니다.`)) return
    setPendingId(rev.id)
    try {
      const updated = await revertArticle(article.id, rev.id)
      router.push(`/admin/articles/${updated.slug}/edit`)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <AdminGuard allow={['OWNER', 'CONTRIBUTOR']}>
      <div className="pt-20 max-w-3xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-white uppercase tracking-[0.3em] text-sm font-bold">Revision History</h1>
            {article && <p className="text-zinc-500 text-xs mt-2 truncate">{article.title}</p>}
          </div>
          {article && (
            <Link
              href={`/admin/articles/${article.slug}/edit`}
              className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest transition-colors"
            >
              Back to Edit
            </Link>
          )}
        </div>

        {loading ? (
          <p className="text-zinc-600 uppercase tracking-widest text-xs">Loading...</p>
        ) : revisions.length === 0 ? (
          <p className="text-zinc-600 uppercase tracking-widest text-xs">No revisions yet — every save creates one.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-800">
            {revisions.map((r) => (
              <div key={r.id} className="py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-600 text-[10px] uppercase tracking-widest">
                    {new Date(r.savedAt).toLocaleString()}
                  </p>
                  <p className="text-white font-bold mt-1 truncate">{r.title}</p>
                  <p className="text-zinc-500 text-xs mt-1 truncate">
                    {stripHtml(r.content).slice(0, 140)}
                  </p>
                </div>
                <button
                  onClick={() => handleRevert(r)}
                  disabled={pendingId === r.id}
                  className="text-xs uppercase tracking-widest text-accent hover:opacity-80 transition-opacity disabled:opacity-40 flex-shrink-0"
                >
                  Revert
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  )
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
