import { siteConfig } from "@/lib/content";

/** Call-to-action section for booking / contact */
export function ContactCTA() {
  return (
    <section className="border-t border-stone-200 bg-stone-900 px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-400">
          Let&apos;s talk
        </p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Looking for product advice?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-300">
          Need help validating an idea, building an MVP, or shaping product
          strategy? Drop me a line and let&apos;s figure out how I can help.
        </p>
        <a
          href={`mailto:${siteConfig.email}`}
          className="mt-8 inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
        >
          {siteConfig.email}
        </a>
      </div>
    </section>
  );
}
