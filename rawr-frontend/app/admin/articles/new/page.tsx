'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminGuard from '@/components/AdminGuard'
import { createArticle } from '@/lib/api'

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [category, setCategory] = useState<'FASHION' | 'SHOP'>('FASHION')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim() || saving) return
    setSaving(true)
    try {
      const created = await createArticle({
        title: title.trim(),
        content: content.trim(),
        coverImage: coverImage.trim() || null,
        category,
      })
      router.push(`/admin/articles/${created.slug}/edit`)
    } catch {
      setSaving(false)
    }
  }

  return (
    <AdminGuard allow={['OWNER', 'CONTRIBUTOR']}>
      <div className="pt-20 max-w-3xl mx-auto px-6 pb-24">
        <h1 className="text-white uppercase tracking-[0.3em] text-sm font-bold mb-10">New Article</h1>
        <ArticleForm
          title={title} onTitle={setTitle}
          content={content} onContent={setContent}
          coverImage={coverImage} onCoverImage={setCoverImage}
          category={category} onCategory={setCategory}
          saving={saving} submitLabel="Create"
          onSubmit={handleSubmit}
        />
      </div>
    </AdminGuard>
  )
}

function ArticleForm(props: {
  title: string; onTitle: (v: string) => void
  content: string; onContent: (v: string) => void
  coverImage: string; onCoverImage: (v: string) => void
  category: 'FASHION' | 'SHOP'; onCategory: (v: 'FASHION' | 'SHOP') => void
  saving: boolean; submitLabel: string
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={props.onSubmit} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-zinc-500 text-xs uppercase tracking-widest">Title</span>
        <input
          type="text"
          required
          value={props.title}
          onChange={(e) => props.onTitle(e.target.value)}
          className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-zinc-500 text-xs uppercase tracking-widest">Category</span>
        <select
          value={props.category}
          onChange={(e) => props.onCategory(e.target.value as 'FASHION' | 'SHOP')}
          className="bg-black border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-accent"
        >
          <option value="FASHION">FASHION</option>
          <option value="SHOP">SHOP</option>
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-zinc-500 text-xs uppercase tracking-widest">Cover image URL (optional)</span>
        <input
          type="url"
          value={props.coverImage}
          onChange={(e) => props.onCoverImage(e.target.value)}
          placeholder="https://..."
          className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-zinc-500 text-xs uppercase tracking-widest">Content (HTML)</span>
        <textarea
          required
          value={props.content}
          onChange={(e) => props.onContent(e.target.value)}
          rows={20}
          className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-accent font-mono text-sm leading-relaxed"
        />
      </label>

      <button
        type="submit"
        disabled={props.saving}
        className="bg-accent text-black px-6 py-3 uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 self-start"
      >
        {props.saving ? 'Saving...' : props.submitLabel}
      </button>
    </form>
  )
}
