import type { Metadata } from "next";
import { AppCard } from "@/components/AppCard";
import { SectionHeading } from "@/components/Services";
import { getAllApps } from "@/lib/content";

export const metadata: Metadata = {
  title: "Side Projects",
  description: "Projects I enjoyed building and some I didn't.",
};

/** Full catalog of apps and side projects */
export default function AppsPage() {
  const allApps = getAllApps();

  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          label=""
          title="Side Projects"
          description="Click through to try them out."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allApps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </div>
    </div>
  );
}
