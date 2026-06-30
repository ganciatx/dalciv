import { sections, siteConfig } from "@/lib/content";

/** Landing page hero — bold intro inspired by PM portfolio sites */
export function Hero() {
  const firstName = siteConfig.name.split(" ")[0];

  return (
    <section className="px-6 pt-20 pb-16">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-stone-400">
          {siteConfig.location}
        </p>

        <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
          Hello.
          <br />
          I&apos;m {firstName}.
        </h1>

        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-stone-600 sm:text-2xl">
          {siteConfig.title} — {siteConfig.tagline}
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            {sections.hero.primaryCta}
          </a>
          <a
            href={sections.hero.secondaryHref}
            className="inline-flex items-center rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-100"
          >
            {sections.hero.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}
