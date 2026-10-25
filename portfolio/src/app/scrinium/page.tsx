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
          <p className="mt-6 max-w-2xl text-lg text-stone-600">
            A Mac utility for tuning performance, cleaning up leftovers, and keeping an eye on
            what your machine is doing, all from one window.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-stone-100 px-6 py-3 text-sm font-medium text-stone-500">
              Coming soon
            </span>
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
            description="This first public build has not been released yet. The app is still in pre-distribution testing."
          />
          <div className="max-w-2xl">
            <div className="rounded-2xl border border-stone-200 bg-white p-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-stone-900">{DOWNLOAD_FILE}</h3>
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Coming soon
                </span>
              </div>
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
                  <dd className="mt-1 text-stone-600">Not yet public</dd>
                </div>
              </dl>
              <button
                type="button"
                disabled
                className="mt-8 inline-flex cursor-not-allowed rounded-full border border-stone-300 bg-stone-100 px-6 py-3 text-sm font-medium text-stone-500"
              >
                Coming soon
              </button>
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
    </>
  );
}
