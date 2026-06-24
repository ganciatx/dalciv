import fs from "fs";
import path from "path";
import matter from "gray-matter";

/** Blog post metadata parsed from markdown frontmatter */
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  emoji: string;
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), "content/blog");

/** Read and parse a single markdown file into a BlogPost */
function parsePost(filename: string): BlogPost {
  const filePath = path.join(BLOG_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug: filename.replace(/\.md$/, ""),
    title: data.title as string,
    excerpt: data.excerpt as string,
    date: data.date as string,
    category: data.category as string,
    emoji: (data.emoji as string) ?? "📝",
    content,
  };
}

/** Return all posts sorted newest first */
export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"))
    .map(parsePost)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Fetch a single post by slug, or undefined if not found */
export function getPostBySlug(slug: string): BlogPost | undefined {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return undefined;
  return parsePost(`${slug}.md`);
}

/** Return the N most recent posts for the landing page preview */
export function getLatestPosts(count: number): BlogPost[] {
  return getAllPosts().slice(0, count);
}

/** Format an ISO date string for display */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
