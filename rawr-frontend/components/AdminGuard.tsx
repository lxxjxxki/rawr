'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'

type Allowed = 'OWNER' | 'CONTRIBUTOR'

export default function AdminGuard({
  children,
  allow,
}: {
  children: React.ReactNode
  allow: Allowed[]
}) {
  const router = useRouter()
  const { user } = useUIStore()

  useEffect(() => {
    if (user === null) return
    if (!allow.includes(user.role as Allowed)) {
      router.replace('/mypage')
    }
  }, [user, allow, router])

  if (!user) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <p className="text-zinc-600 uppercase tracking-widest text-xs">Sign in required</p>
      </div>
    )
  }
  if (!allow.includes(user.role as Allowed)) {
    return null
  }
  return <>{children}</>
}
