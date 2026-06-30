import { sections, services } from "@/lib/content";

interface SectionHeadingProps {
  label: string;
  title: string;
  description?: string;
}

/** Reusable section heading used across landing and inner pages */
export function SectionHeading({ label, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-12">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-stone-400">
        {label}
      </p>
      <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-2xl text-lg text-stone-600">{description}</p>
      )}
    </div>
  );
}

/** About + services grid on the landing page */
export function Services() {
  return (
    <section className="border-t border-stone-200 bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          label={sections.services.label}
          title={sections.services.title}
          description={sections.services.description}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="rounded-2xl border border-stone-200 bg-[#FAFAF8] p-6 transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-stone-900">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
