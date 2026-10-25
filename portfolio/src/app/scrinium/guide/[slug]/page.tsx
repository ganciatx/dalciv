import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";

interface GuidePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const guideDir = path.join(process.cwd(), "content/scrinium-guide");

  return fs
    .readdirSync(guideDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({ slug: file.replace(/\.md$/, "") }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = loadGuideBySlug(slug);

  if (!guide) {
    return { title: "Guide not found" };
  }

  return {
    title: guide.title,
    description: guide.description,
  };
}

function loadGuideBySlug(slug: string) {
  const guideDir = path.join(process.cwd(), "content/scrinium-guide");
  const filePath = path.join(guideDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const { data, content } = matter(fs.readFileSync(filePath, "utf-8"));

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    section: String(data.section ?? "General"),
    content: content.replace(/^# .*\n+/, ""),
  };
}

export default async function GuideArticlePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = loadGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-stone-500">
          <Link href="/scrinium" className="hover:text-stone-900">
            Scrinium
          </Link>
          <span className="mx-2">/</span>
          <Link href="/scrinium/guide" className="hover:text-stone-900">
            User guide
          </Link>
          <span className="mx-2">/</span>
          <span>{guide.section}</span>
        </p>

        <article className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
            {guide.section}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-lg text-stone-600">{guide.description}</p>

          <div className="mt-8">
            <MarkdownContent content={guide.content} />
          </div>
        </article>

        <div className="mt-10">
          <Link
            href="/scrinium/guide"
            className="text-sm font-medium text-stone-900 underline underline-offset-4"
          >
            Back to guide index
          </Link>
        </div>
      </div>
    </section>
  );
}
