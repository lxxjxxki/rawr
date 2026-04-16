import Link from 'next/link'
import Image from 'next/image'
import type { ArticleResponse } from '@/types'

interface Props {
  article: ArticleResponse
}

export default function ArticleCard({ article }: Props) {
  return (
    <Link href={`/articles/${article.slug}`} className="group block relative aspect-square overflow-hidden">
      {/* Image */}
      {article.coverImage ? (
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-900" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        {/* Category tag */}
        <span className="text-accent text-xs uppercase tracking-widest font-bold">
          {article.category}
        </span>
        {/* Title */}
        <p className="text-white text-sm font-bold mt-1 line-clamp-2 leading-tight">
          {article.title}
        </p>
      </div>
    </Link>
  )
}
