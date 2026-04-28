'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'
import { getLikeStatus, toggleLike } from '@/lib/api'

interface Props {
  articleId: string
}

export default function LikeButton({ articleId }: Props) {
  const router = useRouter()
  const { user } = useUIStore()
  const [count, setCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    let active = true
    getLikeStatus(articleId)
      .then((res) => {
        if (!active) return
        setCount(res.count)
        setLiked(res.liked)
      })
      .catch(() => {
        if (!active) return
        setAvailable(false)
      })
    return () => {
      active = false
    }
  }, [articleId])

  async function handleClick() {
    if (!user) {
      router.push('/mypage')
      return
    }
    if (loading || !available) return

    const prevCount = count
    const prevLiked = liked

    setLiked(!prevLiked)
    setCount(prevCount + (prevLiked ? -1 : 1))
    setLoading(true)

    try {
      const res = await toggleLike(articleId)
      setCount(res.count)
      setLiked(res.liked)
    } catch {
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || !available}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={`text-xs uppercase tracking-widest transition-colors disabled:opacity-40 ${
        liked ? 'text-accent' : 'text-white'
      }`}
    >
      LIKE · {count}
    </button>
  )
}
