"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function InviteMemberForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const { error } = await authClient.organization.inviteMember({
      email,
      role: "member",
    });
    setPending(false);
    if (error) {
      setMessage(error.message ?? "Invite failed");
      return;
    }
    setMessage("Invitation sent.");
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span>Email</span>
        <input
          name="email"
          type="email"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      {message ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Sending…" : "Send invite"}
      </button>
    </form>
  );
}
