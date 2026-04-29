import { notFound } from 'next/navigation'
import { getArticleBySlug } from '@/lib/api'
import { highlightHashtags } from '@/lib/highlightHashtags'
import { linkifyMentions } from '@/lib/linkifyMentions'
import BookmarkButton from '@/components/BookmarkButton'
import LikeButton from '@/components/LikeButton'
import type { Metadata } from 'next'

export const revalidate = 60

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const article = await getArticleBySlug(params.slug)
    return {
      title: `${article.title} — rawr`,
      description: article.content.slice(0, 160),
      openGraph: {
        title: article.title,
        description: article.content.slice(0, 160),
        images: article.coverImage ? [article.coverImage] : [],
      },
    }
  } catch {
    return { title: 'rawr' }
  }
}

export default async function ArticlePage({ params }: Props) {
  let article
  try {
    article = await getArticleBySlug(params.slug)
  } catch {
    notFound()
  }

  return (
    <article className="pt-20 pb-24 max-w-3xl mx-auto px-6">
      {/* Cover image — natural aspect ratio so IG portrait/square posts aren't cropped */}
      {article.coverImage && (
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-auto mb-10"
        />
      )}

      {/* Category */}
      <p className="text-accent uppercase tracking-widest text-xs font-bold mb-3">
        {article.category}
      </p>

      {/* Title */}
      <h1 className="text-white text-4xl font-bold leading-tight mb-4">
        {article.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center justify-between gap-4 text-zinc-500 text-sm mb-10 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <span>{article.authorName}</span>
          {article.publishedAt && (
            <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          )}
        </div>
        <div className="flex items-center gap-5">
          <LikeButton articleId={article.id} />
          <BookmarkButton articleId={article.id} />
        </div>
      </div>

      {/* Content */}
      <div
        className="prose prose-invert prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: linkifyMentions(highlightHashtags(article.content)) }}
      />
    </article>
  )
}
