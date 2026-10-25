import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import GuideViewer from "./GuideViewer";

const SECTION_ORDER = [
  "Getting started",
  "Find",
  "Search",
  "Browse",
  "Organize",
  "Customize",
  "Rename",
  "Tools",
  "Reference",
];

function sectionRank(section: string): number {
  const index = SECTION_ORDER.indexOf(section);
  return index === -1 ? SECTION_ORDER.length : index;
}

interface GuidePage {
  slug: string;
  title: string;
  description: string;
  section: string;
  order: number;
}

function loadGuidePages(): GuidePage[] {
  const guideDir = path.join(process.cwd(), "content/scrinium-guide");

  return fs
    .readdirSync(guideDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(guideDir, file);
      const { data } = matter(fs.readFileSync(fullPath, "utf-8"));

      return {
        slug: file.replace(/\.md$/, ""),
        title: String(data.title ?? file.replace(/\.md$/, "")),
        description: String(data.description ?? ""),
        section: String(data.section ?? "General"),
        order: Number(data.order ?? 0),
      };
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function groupBySection(pages: GuidePage[]) {
  const groups = new Map<string, GuidePage[]>();

  for (const page of pages) {
    const list = groups.get(page.section) ?? [];
    list.push(page);
    groups.set(page.section, list);
  }

  return Array.from(groups.entries())
    .map(([section, pages]) => ({ section, pages }))
    .sort(
      (a, b) =>
        sectionRank(a.section) - sectionRank(b.section) || a.section.localeCompare(b.section)
    );
}

export default function GuideList() {
  const pages = loadGuidePages();
  const groups = groupBySection(pages);
  const defaultSlug = pages[0]?.slug ?? "install-and-first-launch";

  return (
    <section className="px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Guide contents" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
            On this page
          </p>

          <div className="mt-5 space-y-5">
            {groups.map((group) => (
              <div key={group.section}>
                <div className="text-xl font-semibold text-stone-900">{group.section}</div>
                <ul className="mt-3 space-y-2 border-l border-stone-200 pl-3">
                  {group.pages.map((page) => (
                    <li key={page.slug}>
                      <Link
                        href={`/scrinium/guide/${page.slug}`}
                        className="block text-base text-stone-600 transition-colors hover:text-stone-900"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <article className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">Browse</p>
          <h2 className="mt-3 text-5xl font-bold tracking-tight text-stone-900">Scrinium guide</h2>
          <p className="mt-4 max-w-2xl text-xl text-stone-600">
            Start with the article you need, or browse the guide by section.
          </p>

          <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
            <GuideViewer fileName={defaultSlug} />
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              href={`/scrinium/guide/${defaultSlug}`}
              className="text-sm font-medium text-stone-900 underline underline-offset-4"
            >
              Open full article page
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}