import Link from "next/link";
import { siteConfig } from "@/lib/content";

/** Site-wide footer with social links and copyright */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <p className="text-sm text-stone-500">
          &copy; {year} {siteConfig.name}. All rights reserved.
        </p>

        <div className="flex items-center gap-5">
          {siteConfig.social.linkedin && (
            <a
              href={siteConfig.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-500 transition-colors hover:text-stone-900"
            >
              LinkedIn
            </a>
          )}
          {siteConfig.social.github && (
            <a
              href={siteConfig.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-500 transition-colors hover:text-stone-900"
            >
              GitHub
            </a>
          )}
          {siteConfig.social.twitter && (
            <a
              href={siteConfig.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-500 transition-colors hover:text-stone-900"
            >
              Twitter
            </a>
          )}
          <Link
            href="/apps"
            className="text-sm text-stone-500 transition-colors hover:text-stone-900"
          >
            Side Projects
          </Link>
          <Link
            href="/blog"
            className="text-sm text-stone-500 transition-colors hover:text-stone-900"
          >
            Blog
          </Link>
        </div>
      </div>
    </footer>
  );
}
