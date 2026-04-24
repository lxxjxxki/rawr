'use client'

import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { toggleBookmark } from '@/lib/api'

interface Props {
  articleId: string
}

export default function BookmarkButton({ articleId }: Props) {
  const { user } = useUIStore()
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  // Persist bookmark state per article in localStorage
  useEffect(() => {
    if (!user) return
    const saved = localStorage.getItem(`bm_${articleId}`)
    if (saved !== null) setBookmarked(saved === '1')
  }, [user, articleId])

  if (!user) return null

  async function handleToggle() {
    if (loading) return
    setLoading(true)
    try {
      const res = await toggleBookmark(articleId)
      setBookmarked(res.bookmarked)
      localStorage.setItem(`bm_${articleId}`, res.bookmarked ? '1' : '0')
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className="flex items-center gap-2 text-xs uppercase tracking-widest transition-colors disabled:opacity-40"
    >
      <svg
        width="18"
        height="22"
        viewBox="0 0 20 24"
        fill={bookmarked ? 'white' : 'none'}
        stroke="white"
        strokeWidth="1.5"
      >
        <path d="M3 3h14v18l-7-4-7 4V3z" />
      </svg>
      <span className="text-zinc-400">{bookmarked ? 'Saved' : 'Save'}</span>
    </button>
  )
}
