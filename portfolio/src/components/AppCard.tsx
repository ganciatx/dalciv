import Image from "next/image";
import Link from "next/link";
import type { App } from "@/lib/content";

interface AppCardProps {
  app: App;
  /** When true, renders as a compact card for the landing page grid */
  compact?: boolean;
}

/** Card component for displaying a single app/product */
export function AppCard({ app, compact = false }: AppCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all hover:border-stone-300 hover:shadow-lg">
      {app.image ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
          <Image
            src={app.image}
            alt={app.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center bg-stone-50 ${
            compact ? "h-32" : "h-40"
          }`}
        >
          <span className="text-4xl" role="img" aria-label={app.name}>
            {app.emoji}
          </span>
        </div>
      )}

      <div className={compact ? "flex flex-1 flex-col p-6" : "flex flex-1 flex-col p-8"}>
        <h3 className="text-xl font-semibold text-stone-900 group-hover:text-stone-700">
          {app.name}
        </h3>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
          {app.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {app.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-stone-100 px-3 py-0.5 text-xs font-medium text-stone-600"
            >
              {tag}
            </span>
          ))}
        </div>

        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center text-sm font-medium text-stone-900 transition-colors hover:text-stone-600"
        >
          Open
          <span className="ml-1 transition-transform group-hover:translate-x-0.5">
            &rarr;
          </span>
        </a>
      </div>
    </article>
  );
}

/** Grid wrapper for app cards with optional "view all" link */
export function AppGrid({
  apps,
  showViewAll = false,
}: {
  apps: App[];
  showViewAll?: boolean;
}) {
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} compact />
        ))}
      </div>

      {showViewAll && (
        <div className="mt-10 text-center">
          <Link
            href="/apps"
            className="inline-flex items-center rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-100"
          >
            View all apps
          </Link>
        </div>
      )}
    </div>
  );
}
