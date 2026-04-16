import ArticleCard from './ArticleCard'
import type { ArticleResponse } from '@/types'

interface Props {
  articles: ArticleResponse[]
}

export default function ArticleGrid({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-zinc-600 uppercase tracking-widest text-sm">No articles yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px]">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}
