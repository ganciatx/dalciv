import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { AppGrid } from "@/components/AppCard";
import { BlogGrid } from "@/components/BlogCard";
import { ContactCTA } from "@/components/ContactCTA";
import { SectionHeading } from "@/components/Services";
import { getFeaturedApps } from "@/lib/content";
import { getLatestPosts } from "@/lib/blog";

/** Landing page — hero, services, featured apps, latest blog posts, contact CTA */
export default function HomePage() {
  const featuredApps = getFeaturedApps();
  const latestPosts = getLatestPosts(3);

  return (
    <>
      <Hero />

      <Services />

      <section id="apps" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            label="Products"
            title="Apps I've Built"
            description="Side projects, experiments, and tools I've shipped. Each one started as a hypothesis — click through to try them."
          />
          <AppGrid apps={featuredApps} showViewAll />
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            label="Writing"
            title="Latest Content"
            description="Thoughts on product management, validation, and building things people want."
          />
          <BlogGrid posts={latestPosts} showViewAll />
        </div>
      </section>

      <ContactCTA />
    </>
  );
}
