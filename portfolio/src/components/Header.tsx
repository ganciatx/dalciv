import Link from "next/link";
import { siteConfig } from "@/lib/content";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/side-projects", label: "Side Projects" },
  { href: "/blog", label: "Blog" },
];

/** Site-wide header with navigation and contact CTA */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#FAFAF8]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-stone-900 transition-colors hover:text-stone-600"
        >
          {siteConfig.name.split(" ")[0]}
        </Link>

        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-stone-600 transition-colors hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`mailto:${siteConfig.email}`}
            className="rounded-full bg-stone-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
