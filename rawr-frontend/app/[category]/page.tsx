import { notFound, redirect } from 'next/navigation'
import ArticleGrid from '@/components/ArticleGrid'
import { getArticles } from '@/lib/api'
import type { ArticleResponse } from '@/types'

const BACKEND_CATEGORIES: Record<string, string> = {
  fashion: 'FASHION',
}

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = ['fashion']
const REDIRECT_CATEGORIES = ['music', 'art', 'etc']

interface Props {
  params: { category: string }
}

export default async function CategoryPage({ params }: Props) {
  const slug = params.category.toLowerCase()

  if (REDIRECT_CATEGORIES.includes(slug)) redirect('/fashion')
  if (!VALID_CATEGORIES.includes(slug)) notFound()

  let articles: ArticleResponse[] = []

  if (BACKEND_CATEGORIES[slug]) {
    try {
      const data = await getArticles(BACKEND_CATEGORIES[slug], 0, 1000)
      articles = data.content
    } catch {
      articles = []
    }
  }

  return (
    <div className="pt-20">
      {/* Category title */}
      <h1 className="text-center text-white uppercase tracking-[0.3em] text-lg font-bold py-8 border-b border-zinc-800">
        {slug.toUpperCase()}
      </h1>

      <ArticleGrid articles={articles} />
    </div>
  )
}
