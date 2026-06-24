import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { getAllPosts, getPostBySlug, formatDate } from "@/lib/blog";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-render all blog post pages at build time */
export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/** Dynamic metadata from post frontmatter */
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

/** Individual blog post page */
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <article className="px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/blog"
          className="text-sm text-stone-500 transition-colors hover:text-stone-900"
        >
          &larr; Back to blog
        </Link>

        <header className="mt-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label={post.category}>
              {post.emoji}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              {post.category}
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-stone-900">
            {post.title}
          </h1>

          <time className="mt-4 block text-sm text-stone-400" dateTime={post.date}>
            {formatDate(post.date)}
          </time>
        </header>

        <div className="mt-10 border-t border-stone-200 pt-10">
          <MarkdownContent content={post.content} />
        </div>
      </div>
    </article>
  );
}
