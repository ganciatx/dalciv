import type { Metadata } from "next";
import { BlogCard } from "@/components/BlogCard";
import { SectionHeading } from "@/components/Services";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles on...",
};

/** Blog index — lists all posts sorted by date */
export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          label="Writing"
          title="Blog"
          description="Notes on product management, MVPs, validation, and the craft of building things people want."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
