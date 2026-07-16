"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/slugify";

export function NewOrgForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const slugInput = String(fd.get("slug") ?? "").trim();
    const slug = slugInput || slugify(name);
    const { error: err } = await authClient.organization.create({
      name,
      slug,
      keepCurrentActiveOrganization: false,
    });
    setPending(false);
    if (err) {
      setError(err.message ?? "Could not create organization");
      return;
    }
    router.push("/products");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create your organization
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Your team shares one workspace. You can invite members later from
        Organization settings.
      </p>
      <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Organization name
          </span>
          <input
            name="name"
            required
            placeholder="e.g. Acme Product"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            URL slug
          </span>
          <input
            name="slug"
            placeholder="auto from name if empty"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Creating…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
