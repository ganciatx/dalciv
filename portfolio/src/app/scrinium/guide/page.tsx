import type { Metadata } from "next";
import GuideList from "@/components/GuideList";

export const metadata: Metadata = {
  title: "Scrinium User Guide",
  description: "Step-by-step guide to installing, verifying, and setting up Scrinium for macOS.",
};

export default function ScriniumGuidePage() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <GuideList />
      </div>
    </section>
  );
}
