'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminGuard from '@/components/AdminGuard'
import { getArticleBySlug, updateArticle } from '@/lib/api'
import type { ArticleResponse } from '@/types'

interface Props {
  params: { slug: string }
}

export default function EditArticlePage({ params }: Props) {
  const router = useRouter()
  const [article, setArticle] = useState<ArticleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [category, setCategory] = useState<'FASHION' | 'SHOP'>('FASHION')

  useEffect(() => {
    setLoading(true)
    getArticleBySlug(params.slug)
      .then((a) => {
        setArticle(a)
        setTitle(a.title)
        setContent(a.content)
        setCoverImage(a.coverImage ?? '')
        setCategory((a.category as 'FASHION' | 'SHOP') || 'FASHION')
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!article || !title.trim() || !content.trim() || saving) return
    setSaving(true)
    try {
      const updated = await updateArticle(article.id, {
        title: title.trim(),
        content: content.trim(),
        coverImage: coverImage.trim() || null,
        category,
      })
      if (updated.slug !== params.slug) {
        router.replace(`/admin/articles/${updated.slug}/edit`)
      } else {
        setArticle(updated)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminGuard allow={['OWNER', 'CONTRIBUTOR']}>
      <div className="pt-20 max-w-3xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-white uppercase tracking-[0.3em] text-sm font-bold">Edit Article</h1>
          {article && (
            <Link
              href={`/admin/articles/${article.slug}/revisions`}
              className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest transition-colors"
            >
              History
            </Link>
          )}
        </div>

        {loading ? (
          <p className="text-zinc-600 uppercase tracking-widest text-xs">Loading...</p>
        ) : notFound ? (
          <p className="text-zinc-600 uppercase tracking-widest text-xs">Article not found</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-zinc-500 text-xs uppercase tracking-widest">Title</span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-zinc-500 text-xs uppercase tracking-widest">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'FASHION' | 'SHOP')}
                className="bg-black border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-accent"
              >
                <option value="FASHION">FASHION</option>
                <option value="SHOP">SHOP</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-zinc-500 text-xs uppercase tracking-widest">Cover image URL</span>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-zinc-500 text-xs uppercase tracking-widest">Content (HTML)</span>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={24}
                className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-accent font-mono text-sm leading-relaxed"
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-accent text-black px-6 py-3 uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <Link
                href="/admin/articles"
                className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </AdminGuard>
  )
}
