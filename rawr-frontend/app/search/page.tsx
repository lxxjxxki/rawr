import { notFound } from 'next/navigation'
import ArticleGrid from '@/components/ArticleGrid'
import { searchArticles } from '@/lib/api'
import type { ArticleResponse } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { q?: string }
}

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q?.trim()

  if (!q) notFound()

  let articles: ArticleResponse[] = []
  try {
    const data = await searchArticles(q)
    articles = data.content
  } catch {
    articles = []
  }

  return (
    <div className="pt-20">
      <h1 className="text-center text-white uppercase tracking-[0.3em] text-lg font-bold py-8 border-b border-zinc-800">
        &ldquo;{q}&rdquo;
      </h1>

      {articles.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <p className="text-zinc-600 uppercase tracking-widest text-sm">No results</p>
        </div>
      ) : (
        <ArticleGrid articles={articles} />
      )}
    </div>
  )
}
