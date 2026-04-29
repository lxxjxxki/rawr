'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'
import { getAdminUsers, changeUserRole } from '@/lib/api'
import type { AdminUser } from '@/types'

export default function AdminUsersPage() {
  const router = useRouter()
  const { user } = useUIStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    if (user === null) return
    if (user.role !== 'OWNER') {
      router.replace('/mypage')
      return
    }
    setLoading(true)
    getAdminUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, router])

  if (!user) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <p className="text-zinc-600 uppercase tracking-widest text-xs">Sign in required</p>
      </div>
    )
  }

  if (user.role !== 'OWNER') {
    return null
  }

  async function handleRoleChange(target: AdminUser, newRole: 'READER' | 'CONTRIBUTOR') {
    if (target.role === newRole) return
    setPendingId(target.id)
    try {
      const updated = await changeUserRole(target.id, newRole)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch {
      // ignore
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="pt-20 max-w-4xl mx-auto px-6 pb-24">
      <h1 className="text-white uppercase tracking-[0.3em] text-sm font-bold mb-10">Admin · Users</h1>

      {loading ? (
        <p className="text-zinc-600 uppercase tracking-widest text-xs">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-zinc-600 uppercase tracking-widest text-xs">No users</p>
      ) : (
        <div className="flex flex-col divide-y divide-zinc-800">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-4 py-4">
              <div className="flex-shrink-0">
                {u.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.profileImage}
                    alt={u.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <span className="text-white text-base font-bold uppercase">{u.username[0]}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base truncate">{u.username}</p>
                <p className="text-zinc-500 text-xs truncate">{u.email}</p>
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-1">
                  Joined {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>

              <div className="flex-shrink-0">
                {u.role === 'OWNER' ? (
                  <span className="text-accent uppercase tracking-widest text-xs font-bold">Owner</span>
                ) : (
                  <div className="flex border border-zinc-800">
                    {(['READER', 'CONTRIBUTOR'] as const).map((r) => (
                      <button
                        key={r}
                        disabled={pendingId === u.id || u.role === r}
                        onClick={() => handleRoleChange(u, r)}
                        className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${
                          u.role === r
                            ? 'bg-accent text-black'
                            : 'text-zinc-400 hover:text-white disabled:opacity-40'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
