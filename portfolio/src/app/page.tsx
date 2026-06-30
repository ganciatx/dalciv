import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { AppGrid } from "@/components/AppCard";
import { BlogGrid } from "@/components/BlogCard";
import { ContactCTA } from "@/components/ContactCTA";
import { SectionHeading } from "@/components/Services";
import { getFeaturedApps, sections } from "@/lib/content";
import { getLatestPosts } from "@/lib/blog";

/** Landing page — hero, services, featured apps, latest blog posts, contact CTA */
export default function HomePage() {
  const featuredApps = getFeaturedApps();
  const latestPosts = getLatestPosts(3);

  return (
    <>
      <Hero />

      <Services />

      <section id="side-projects" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            label={sections.sideProjects.label}
            title={sections.sideProjects.title}
            description={sections.sideProjects.description}
          />
          <AppGrid apps={featuredApps} showViewAll />
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            label={sections.blog.label}
            title={sections.blog.title}
            description={sections.blog.description}
          />
          <BlogGrid posts={latestPosts} showViewAll />
        </div>
      </section>

      <ContactCTA />
    </>
  );
}
