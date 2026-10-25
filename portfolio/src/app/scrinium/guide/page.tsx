import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Metadata } from "next";
import Link from "next/link";
import { MarkdownContent } from "@/components/MarkdownContent";

export const metadata: Metadata = {
  title: "Scrinium User Guide",
  description: "Step-by-step guide to installing, verifying, and setting up Scrinium for macOS.",
};

const GUIDE_DIR = path.join(process.cwd(), "content/scrinium-guide");

/** Display order for guide sections; unlisted sections go last, alphabetically */
const SECTION_ORDER = [
  "Getting Started",
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
  content: string;
}

/** Read guide markdown files, sorted by their frontmatter order */
function loadGuidePages(): GuidePage[] {
  return fs
    .readdirSync(GUIDE_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const { data, content } = matter(fs.readFileSync(path.join(GUIDE_DIR, file), "utf-8"));
      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title as string,
        description: data.description as string,
        section: data.section as string,
        order: Number(data.order),
        content: content.replace(/^# .*\n+/, ""),
      };
    })
    .sort((a, b) => a.order - b.order);
}

function groupBySection(pages: GuidePage[]): { section: string; pages: GuidePage[] }[] {
  const groups = new Map<string, GuidePage[]>();
  for (const page of pages) {
    const list = groups.get(page.section);
    if (list) {
      list.push(page);
    } else {
      groups.set(page.section, [page]);
    }
  }
  return Array.from(groups, ([section, pages]) => ({ section, pages})).sort(
    (a, b) => sectionRank(a.section) - sectionRank(b.section) || a.section.localeCompare(b.section)
  );
}

/** Group consecutive pages that share a section, keeping their order 
function groupBySection(pages: GuidePage[]): { section: string; pages: GuidePage[] }[] {
  return pages.reduce<{ section: string; pages: GuidePage[] }[]>((groups, page) => {
    const last = groups[groups.length - 1];
    if (last && last.section === page.section) {
      last.pages.push(page);
    } else {
      groups.push({ section: page.section, pages: [page] });
    }
    return groups;
  }, []);
}*/

/** Scrinium user guide — wiki-style reference with a table of contents */
export default function ScriniumGuidePage() {
  const pages = loadGuidePages();
  const groups = groupBySection(pages);

  return (
    <section className="px-6 py-16">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Guide contents" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
            On this page
          </p>
          <div className="mt-4 space-y-3 text-sm">
            {groups.map((group) => (
              <details key={group.section} open className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-stone-900 [&::-webkit-details-marker]:hidden">
                  {group.section}
                  <span
                    aria-hidden="true"
                    className="text-stone-400 transition-transform group-open:rotate-90"
                  >
                    ›
                  </span>
                </summary>
                <ul className="mt-2 space-y-2 border-l border-stone-200 pl-3">
                  {group.pages.map((page) => (
                    <li key={page.slug}>
                      <a
                        href={`#${page.slug}`}
                        className="text-stone-600 transition-colors hover:text-stone-900"
                      >
                        {page.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </nav>

        <article>
          <p className="text-sm text-stone-500">
            <Link href="/scrinium" className="hover:text-stone-900">
              Scrinium
            </Link>
            <span className="mx-2">/</span>
            <span>User guide</span>
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            User guide
          </h1>

          {pages.map((page) => (
            <section
              key={page.slug}
              id={page.slug}
              className="scroll-mt-24 mt-12 border-t border-stone-200 pt-10"
            >
              <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
                {page.section}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
                {page.title}
              </h2>
              <p className="mt-3 text-lg text-stone-600">{page.description}</p>
              <div className="mt-8">
                <MarkdownContent content={page.content} />
              </div>
            </section>
          ))}

          <div className="mt-16 border-t border-stone-200 pt-8">
            <Link
              href="/scrinium"
              className="text-sm font-medium text-stone-900 underline underline-offset-4"
            >
              Back to Scrinium
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
