import { getToken } from './auth'
import type {
  ArticleResponse,
  CommentResponse,
  PageResponse,
  LikeStatus,
  User,
  AdminUser,
  ArticleRevisionResponse,
  ArticleRequest,
} from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

// Articles
export function getArticles(category?: string, page = 0, size = 12) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (category) params.set('category', category.toUpperCase())
  return request<PageResponse<ArticleResponse>>(`/api/articles?${params}`)
}

export function getArticleBySlug(slug: string) {
  return request<ArticleResponse>(`/api/articles/${slug}`)
}

export function searchArticles(q: string, page = 0, size = 24) {
  const params = new URLSearchParams({ q, page: String(page), size: String(size) })
  return request<PageResponse<ArticleResponse>>(`/api/articles/search?${params}`)
}

// Comments
export function getComments(articleId: string) {
  return request<CommentResponse[]>(`/api/articles/${articleId}/comments`)
}

export function addComment(articleId: string, content: string) {
  return request<CommentResponse>(`/api/articles/${articleId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export function deleteComment(articleId: string, commentId: string) {
  return request<void>(`/api/articles/${articleId}/comments/${commentId}`, { method: 'DELETE' })
}

// Likes
export function getLikeStatus(articleId: string) {
  return request<LikeStatus>(`/api/articles/${articleId}/likes`)
}

export function toggleLike(articleId: string) {
  return request<LikeStatus>(`/api/articles/${articleId}/likes`, { method: 'POST' })
}

// Bookmarks
export function toggleBookmark(articleId: string) {
  return request<{ bookmarked: boolean }>(`/api/articles/${articleId}/bookmarks`, { method: 'POST' })
}

export function getMyBookmarks() {
  return request<ArticleResponse[]>('/api/users/me/bookmarks')
}

// Subscriptions
export function subscribe(email: string) {
  return request<{ message: string }>('/api/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// Auth
export function getMe() {
  return request<User>('/api/auth/me')
}

// Article admin
export function createArticle(payload: ArticleRequest) {
  return request<ArticleResponse>('/api/articles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateArticle(id: string, payload: ArticleRequest) {
  return request<ArticleResponse>(`/api/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteArticle(id: string) {
  return request<void>(`/api/articles/${id}`, { method: 'DELETE' })
}

export function getMyArticles() {
  return request<ArticleResponse[]>('/api/articles/me')
}

export function getMyDeletedArticles() {
  return request<ArticleResponse[]>('/api/articles/me/deleted')
}

export function restoreArticle(id: string) {
  return request<ArticleResponse>(`/api/articles/${id}/restore`, { method: 'POST' })
}

export function getArticleRevisions(id: string) {
  return request<ArticleRevisionResponse[]>(`/api/articles/${id}/revisions`)
}

export function revertArticle(id: string, revisionId: string) {
  return request<ArticleResponse>(`/api/articles/${id}/revert/${revisionId}`, { method: 'POST' })
}

export function getArticleById(id: string) {
  return request<ArticleResponse>(`/api/articles/${id}`)
}

// Admin
export function getAdminUsers() {
  return request<AdminUser[]>('/api/admin/users')
}

export function changeUserRole(userId: string, role: 'READER' | 'CONTRIBUTOR') {
  return request<AdminUser>(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}
