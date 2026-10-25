import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/Services";

export const metadata: Metadata = {
  title: "Scrinium",
  description: "Scrinium for macOS: product info, download, user manual, and release notes.",
};

const DOWNLOAD_URL = "#download";
const DOWNLOAD_FILE = "Scrinium-1.3.0-macOS-universal.zip";

const features = [
  {
    title: "Optimization Suite",
    description:
      "Ten tools in one sidebar: startup profiler, launch predictor, RAM hog killer, battery health, idle reclaimer, shortcut coach, thermal watchdog, cache cleanup, bandwidth monitor, and energy impact triager.",
  },
  {
    title: "Safer Uninstaller",
    description:
      "Lists leftover files after an app is removed. Short or generic name matches are never auto-checked for Trash, and lower-confidence rows are highlighted for review.",
  },
  {
    title: "Live Network & Port Tools",
    description:
      "Scans that run system commands use reliable timeouts, so a stuck subprocess no longer hangs the scan.",
  },
  {
    title: "Local-Only Crash Reports",
    description:
      "Optionally record crashes on your Mac. Export them as JSON when you choose. Nothing is uploaded to a third-party service.",
  },
];

const releases = [
  {
    version: "1.3.0",
    date: "2026-07-11",
    summary: "Optimization Suite is complete, plus local-only crash reports and trust fixes.",
    sections: [
      {
        heading: "New",
        items: [
          "Local crash reports — optionally record crashes on this Mac from Clipboard settings. Export JSON when you want; nothing is uploaded.",
          "Optimization Suite — all ten tools are available in the Optimization sidebar, with optional menu-bar alerts for RAM.",
        ],
      },
      {
        heading: "Improvements",
        items: [
          "Crash diagnostics no longer depend on a Sentry DSN or any third-party error service.",
          "Folder Guard, Background Tasks, RAM Hog Killer, Idle Reclaimer, and Clipboard are easier to scan, with clearer empty states and quieter context-menu actions.",
        ],
      },
      {
        heading: "Fixes",
        items: [
          "Uninstaller — safer leftover selection. Short or generic name matches are no longer auto-checked for Trash.",
          "Live network and port tools — system command timeouts work reliably again.",
        ],
      },
    ],
  },
  {
    version: "1.2.5",
    date: "2026-07-10",
    summary: "Background task explanations now work with a valid Claude model.",
    sections: [
      {
        heading: "Fixes",
        items: [
          "Background Task explanations — fixed Claude API 404 errors caused by an invalid model name.",
        ],
      },
    ],
  },
  {
    version: "1.2.4",
    date: "2026-07-10",
    summary: "Settings are easier to find.",
    sections: [
      {
        heading: "Fixes",
        items: [
          "Settings gear missing — the window toolbar now shows a visible gear button for every utility, and Privacy & Security and Optimization gained a Settings button in the sidebar.",
        ],
      },
    ],
  },
];

/** Scrinium for macOS — product info, download, user manual, and release notes */
export default function ScriniumPage() {
  return (
    <>
      <section className="px-6 py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <Image
            src="/scrinium-icon.webp"
            alt="Scrinium icon"
            width={144}
            height={144}
            priority
            className="h-36 w-36 object-contain"
          />
          <p className="mt-8 text-sm font-medium uppercase tracking-widest text-stone-400">
            macOS App
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl">
            Scrinium
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-stone-600">
            A Mac utility for tuning performance, cleaning up leftovers, and keeping an eye on
            what your machine is doing, all from one window.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={DOWNLOAD_URL}
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700"
            >
              Download for macOS
            </a>
            <Link
              href="/scrinium/guide"
              className="rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900"
            >
              Read the user guide
            </Link>
          </div>
        </div>
      </section>

      <section id="product" className="border-t border-stone-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            label="Product"
            title="What Scrinium does"
            description="Practical tools for understanding and maintaining a Mac, built to be scanned quickly and to stay out of your way."
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-stone-200 bg-[#FAFAF8] p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-stone-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="download" className="border-t border-stone-200 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            label="Download"
            title="Get Scrinium"
            description="Free to try. Choose the universal build, which runs natively on both Apple Silicon and Intel Macs."
          />
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-stone-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-stone-900">{DOWNLOAD_FILE}</h3>
              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-stone-900">Platform</dt>
                  <dd className="mt-1 text-stone-600">macOS 14 or later</dd>
                </div>
                <div>
                  <dt className="font-medium text-stone-900">Architecture</dt>
                  <dd className="mt-1 text-stone-600">Apple Silicon and Intel (universal)</dd>
                </div>
                <div>
                  <dt className="font-medium text-stone-900">Checksums</dt>
                  <dd className="mt-1 text-stone-600">Published as SHA256SUMS.txt with each release</dd>
                </div>
                <div>
                  <dt className="font-medium text-stone-900">Latest version</dt>
                  <dd className="mt-1 text-stone-600">1.3.0 (2026-07-11)</dd>
                </div>
              </dl>
              <a
                href={DOWNLOAD_URL}
                className="mt-8 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700"
              >
                Download 1.3.0
              </a>
            </div>
            <aside className="rounded-2xl border border-stone-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-stone-900">Other versions</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Older builds, 1.2.4 and 1.2.5, are listed in the release notes below.
              </p>
              <a
                href="#release-notes"
                className="mt-6 inline-block text-sm font-medium text-stone-900 underline underline-offset-4"
              >
                View release notes
              </a>
            </aside>
          </div>
        </div>
      </section>

      <section id="manual" className="border-t border-stone-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            label="Docs"
            title="User manual"
            description="The essentials for getting started with Scrinium."
          />
          <p className="max-w-2xl text-stone-600">
            Get set up on first launch and learn the window layout in the user guide.
          </p>
          <Link
            href="/scrinium/guide"
            className="mt-6 inline-block text-sm font-medium text-stone-900 underline underline-offset-4"
          >
            Open the user guide
          </Link>
        </div>
      </section>

      <section id="release-notes" className="border-t border-stone-200 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            label="Changelog"
            title="Release notes"
            description="What has changed in each Scrinium release."
          />
          <div className="space-y-12">
            {releases.map((release) => (
              <article
                key={release.version}
                className="grid gap-6 border-t border-stone-200 pt-10 md:grid-cols-[200px_1fr]"
              >
                <header>
                  <h3 className="text-2xl font-bold tracking-tight text-stone-900">
                    {release.version}
                  </h3>
                  <p className="mt-1 text-sm text-stone-500">{release.date}</p>
                </header>
                <div>
                  <p className="text-stone-700">{release.summary}</p>
                  <div className="mt-6 space-y-6">
                    {release.sections.map((section) => (
                      <div key={section.heading}>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
                          {section.heading}
                        </h4>
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-600">
                          {section.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
