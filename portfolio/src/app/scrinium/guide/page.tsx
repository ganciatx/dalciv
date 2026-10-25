import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scrinium User Guide",
  description: "Step-by-step guide to installing, verifying, and setting up Scrinium for macOS.",
};

const guideSections = [
  {
    id: "install",
    title: "Install",
    paragraphs: [
      "Download the universal zip, unzip it, and move the app into Applications.",
      "Scrinium runs on macOS 14 or later, on both Apple Silicon and Intel Macs.",
    ],
  },
  {
    id: "verify-download",
    title: "Verify the download",
    paragraphs: [
      "Each release publishes SHA256 checksums in SHA256SUMS.txt.",
      "Compare the hash of the zip with the published value before you open it.",
    ],
  },
  {
    id: "full-disk-access",
    title: "Check Full Disk Access",
    paragraphs: [
      "The FDA status indicator sits at the bottom-left of the tool sidebar.",
      "Tools that read protected folders need Full Disk Access to show complete results.",
    ],
  },
  {
    id: "optimization-suite",
    title: "Open the Optimization Suite",
    paragraphs: [
      "Pick any of the ten Optimization tools from the sidebar.",
      "Use the Settings button in the bottom-left of the sidebar to adjust options for that suite.",
    ],
  },
  {
    id: "settings",
    title: "Find settings",
    paragraphs: [
      "Every tool has a settings gear in the window toolbar.",
      "Privacy & Security and Optimization also have a Settings button in the sidebar.",
    ],
  },
  {
    id: "crash-reports",
    title: "Turn on crash reports",
    paragraphs: [
      "Crash reporting is off by default.",
      "Enable it in Clipboard settings if you want crashes recorded locally on this Mac.",
    ],
  },
];

/** Scrinium user guide — wiki-style reference with a table of contents */
export default function ScriniumGuidePage() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Guide contents" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
            On this page
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {guideSections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-stone-600 transition-colors hover:text-stone-900"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
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
          <p className="mt-6 max-w-2xl text-lg text-stone-600">
            The essentials for getting started with Scrinium, one topic per section.
          </p>

          {guideSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 mt-12 border-t border-stone-200 pt-10"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-stone-600">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
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
