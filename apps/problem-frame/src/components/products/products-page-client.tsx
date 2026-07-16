"use client";

import Link from "next/link";
import { useState } from "react";
import { createProduct } from "@/actions/products";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

type ProductRow = {
  id: number;
  productName: string;
  productCode: string;
  status: string;
  lastActivityMs: number;
};

const field =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";

function statusVariant(
  s: string,
): "default" | "success" | "muted" | "warning" {
  if (s === "Active") return "success";
  if (s === "Deprecated") return "muted";
  if (s === "Pilot") return "warning";
  return "default";
}

export function ProductsPageClient({ products }: { products: ProductRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Add Product
        </button>
      </div>

      <Modal
        open={open}
        title="Add product"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-product-form"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Create
            </button>
          </>
        }
      >
        <form
          id="add-product-form"
          action={async (fd) => {
            await createProduct(fd);
            setOpen(false);
          }}
          className="grid gap-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span>Name</span>
            <input name="productName" required className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Code</span>
            <input
              name="productCode"
              required
              placeholder="e.g. TIS"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Category</span>
            <input name="productCategory" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Launch</span>
            <input name="launchDate" type="date" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Status</span>
            <select name="status" className={field} defaultValue="Active">
              <option value="Active">Active</option>
              <option value="Pilot">Pilot</option>
              <option value="Deprecated">Deprecated</option>
            </select>
          </label>
        </form>
      </Modal>

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        {products.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            No products yet. Add one to group problem frames by product line or surface.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="hidden px-4 py-3 sm:table-cell">Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Last updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="transition hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/products/${p.id}/frames`}
                      className="font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {p.productName}
                    </Link>
                  </td>
                  <td className="hidden text-zinc-600 sm:table-cell dark:text-zinc-400">
                    {p.productCode}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="hidden text-zinc-500 md:table-cell">
                    {new Date(p.lastActivityMs).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
