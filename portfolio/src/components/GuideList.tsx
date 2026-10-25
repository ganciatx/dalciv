import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";

interface GuideSummary {
  slug: string;
  title: string;
  description: string;
  section: string;
  order: number;
}

function loadGuideSummaries(): GuideSummary[] {
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

export default function GuideList() {
  const guides = loadGuideSummaries();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
            User guide
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Scrinium guide
          </h1>
        </div>
        <Link
          href="/scrinium"
          className="text-sm font-medium text-stone-700 transition-colors hover:text-stone-900"
        >
          Back to Scrinium
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/scrinium/guide/${guide.slug}`}
            className="rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-300 hover:bg-stone-50"
          >
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">
              {guide.section}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-900">{guide.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{guide.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}