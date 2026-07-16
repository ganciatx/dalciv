"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { BrandLogoLink } from "@/components/brand-logo";

const links = [
  { href: "/products", label: "Products" },
  { href: "/personas", label: "Personas" },
  { href: "/learning-plans", label: "Learning Plans" },
  { href: "/org", label: "Organization" },
];

export function AppNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-8">
          <BrandLogoLink href="/products" />
          <nav className="flex gap-4 text-sm">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={
                  pathname === href || pathname.startsWith(href + "/")
                    ? "font-medium text-brand dark:text-teal-300"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="max-w-[200px] truncate">{userEmail}</span>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-2 py-1 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    window.location.href = "/login";
                  },
                },
              })
            }
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
