import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/Services";

export const metadata: Metadata = {
  title: "Scrinium",
  description: "Scrinium for macOS: product info, download, user manual, and release notes.",
};

const DOWNLOAD_URL = "#download";
const DOWNLOAD_FILE = "Scrinium-1.0-macOS-universal.zip";

const features = [
  {
    title: "Customizable per folder",
    description:
      "Every view setting can be global, overridden on a folder, and inherited by subfolders.",
  },
  {
    title: "Fast on huge folders",
    description:
      "Listings stream in batches, and counts and sizes are calculated in the background.",
  },
  {
    title: "Safe by default",
    description:
      "Every rename is undoable. Deletes always go to the Trash; there is no permanent delete.",
  },
  {
    title: "No lock-in",
    description:
      "Tags, descriptions and custom folder icons are stored on the files in standard macOS formats, so they survive if Scrinium is uninstalled. App-only settings never change file contents.",
  },
];

const releases = [
  {
    version: "1.0",
    summary:
      "Scrinium is a file explorer for your Mac that fixes the things Finder makes harder than they should be.",
    sections: [
      {
        heading: "See what's in your folders",
        items: [
          "Item counts and folder sizes — Items (directly inside), All Items (everything, however deep), Hidden (hidden items at any depth) and a Size for folders. They calculate in the background, and the last result appears instantly when you come back.",
          "Big projects stay fast — folders with 100,000+ files open right away. Tell Scrinium which folders to skip when counting, such as node_modules, and any total that skipped something shows a +.",
          "Sort by anything — click a column header to sort by size, item count or hidden count, not just name and date.",
        ],
      },
      {
        heading: "Name things your way",
        items: [
          "Naming rules — pick a naming template once, and every new file or folder is named automatically, with no dialog. Templates can include today's date, a counter, the parent folder's name, fixed text and prompts.",
          "Prompts — if a template asks for something, such as a client name, the new item opens in rename with that part selected. Press Tab to jump to the next part.",
          "Different rules for different folders — set one rule for everything, or give any folder its own. A folder's rule covers everything inside it.",
          "Bulk rename — select files, press F2 or ⇧⌘R, and combine find and replace (including regular expressions), dates, numbering and templates. A live before/after list flags conflicts before anything changes.",
          "Undo — one click undoes a whole batch of renames, from the pop-up that appears afterward or from Edit → Undo Rename.",
        ],
      },
      {
        heading: "Tags and descriptions",
        items: [
          "Unlimited tags in any color — pick from a color wheel or enter a hex code. Tags are written the way Finder writes them, so Finder, Spotlight and Open/Save dialogs all see them.",
          "Descriptions — add one to any file or folder, saved as Finder comments and visible in Get Info.",
          "Edit anywhere — in list columns, or in the inspector panel (⌘I), where you can also tag several files at once.",
          "Custom folder icons — drop a PNG or SVG onto a folder's icon in the inspector. Icons are kept in a library for reuse, and one click resets a folder to normal.",
        ],
      },
      {
        heading: "Find things",
        items: [
          "Search with operators — name:, ext:, kind:, tag:, desc:, modified:, created:, size: and regex:. For example, ext:pdf size:>50MB modified:>2026-09.",
          "This Folder or This Mac — live results as you type.",
          "Saved filters — turn any search into a sidebar item with one click.",
          "Google Drive and other drives Spotlight can't see are searched directly, so results aren't missing.",
        ],
      },
      {
        heading: "Browse your way",
        items: [
          "Four views (list, columns, icons, gallery), tabs, and an optional dual pane for dragging and copying between folders.",
          "Every folder remembers its view, sort, columns and pane layout. Subfolders follow their parent unless you change them.",
          "Layout templates — save a look and apply it automatically, for example to every folder that contains a .git folder.",
          "Editable sidebar with Favorites, drives and cloud storage. Drag to reorder.",
          "Every shortcut is editable in Settings, with a warning when two actions share a key.",
        ],
      },
      {
        heading: "Preview, terminal and cloud",
        items: [
          "Preview pane (⌥⌘P), remembered per folder — PDFs with page thumbnails and search, spreadsheets and CSV files as tables, code with syntax colors, and Markdown with an Open in Obsidian button. Everything else uses Quick Look.",
          "Built-in terminal (⌃`) running your normal shell, so your own setup works. It can follow the folder you're viewing, and it keeps running while hidden.",
          "Cloud folders — iCloud Drive and Google Drive work like any folder, and every item shows whether it's downloaded or online only. Keep Downloaded and Remove Download are in the right-click menu.",
        ],
      },
      {
        heading: "Safe by design",
        items: [
          "Deleting always moves to the Trash. There is no permanent delete.",
          "Every rename can be undone.",
        ],
      },
      {
        heading: "Good to know",
        items: [
          "Allow Full Disk Access on first launch. The app walks you through it. Without it, macOS asks about Desktop, Documents and Downloads one at a time.",
          "Remove Download works for iCloud Drive only. macOS doesn't let apps remove downloads for Google Drive, so use Drive's own menu for that.",
          "Dragging several selected files moves only the one you grab. Use copy and paste, or F5/F6 to copy and move to the other pane.",
          "A tag's name can't be changed after you create it. You can change its color, or make a new tag.",
          "Use Scrinium for 'Show in Finder' is an optional setting, off by default. You can turn it off any time to hand that back to Finder.",
          "This version isn't signed for distribution yet. It runs on the Mac that built it.",
        ],
      },
      {
        heading: "Coming next",
        items: [
          "Duplicate finder, backup and folder sync, git status badges, and basic scripting (v2), then access from your other devices (v3).",
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
            src="/scrinium-logo.webp"
            alt="Scrinium logo"
            width={800}
            height={188}
            priority
            className="h-auto w-72 object-contain sm:w-96"
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
          <div className="max-w-2xl">
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
                  <dd className="mt-1 text-stone-600">1.0</dd>
                </div>
              </dl>
              <a
                href={DOWNLOAD_URL}
                className="mt-8 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700"
              >
                Download 1.0
              </a>
            </div>
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
