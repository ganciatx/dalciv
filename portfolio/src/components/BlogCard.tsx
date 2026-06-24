import Link from "next/link";
import type { BlogPost } from "@/lib/blog";
import { formatDate } from "@/lib/blog";

interface BlogCardProps {
  post: BlogPost;
}

/** Card component for a blog post preview */
export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition-all hover:border-stone-300 hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl" role="img" aria-label={post.category}>
          {post.emoji}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
          {post.category}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug text-stone-900 group-hover:text-stone-700">
        {post.title}
      </h3>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
        {post.excerpt}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <time className="text-xs text-stone-400" dateTime={post.date}>
          {formatDate(post.date)}
        </time>
        <span className="text-sm font-medium text-stone-900 transition-transform group-hover:translate-x-0.5">
          Read &rarr;
        </span>
      </div>
    </Link>
  );
}

/** Grid wrapper for blog cards with optional "view all" link */
export function BlogGrid({
  posts,
  showViewAll = false,
}: {
  posts: BlogPost[];
  showViewAll?: boolean;
}) {
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      {showViewAll && (
        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-100"
          >
            View all posts
          </Link>
        </div>
      )}
    </div>
  );
}
