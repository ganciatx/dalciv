import type { Metadata } from "next";
import { AppCard } from "@/components/AppCard";
import { SectionHeading } from "@/components/Services";
import { getAllApps } from "@/lib/content";

export const metadata: Metadata = {
  title: "Side Projects",
  description: "DalCiv civic tools, games, and experiments built by Jackson Echols.",
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
          description="Civic data tools and experiments hosted on this site. External apps open in a new tab."
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
