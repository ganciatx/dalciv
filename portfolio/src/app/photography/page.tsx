import type { Metadata } from "next";
import Image from "next/image";
import { SectionHeading } from "@/components/Services";
import { getAllPhotos } from "@/lib/photography";

export const metadata: Metadata = {
  title: "Photography",
  description: "A photography exhibit.",
};

/** Masonry exhibit — each photo keeps its native aspect ratio so nothing is cropped */
export default function PhotographyPage() {
  const photos = getAllPhotos();

  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <SectionHeading label="Exhibit" title="Photography" />

        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {photos.map((photo) => (
            <figure key={photo.src} className="group mb-4 break-inside-avoid">
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className="h-auto w-full rounded-xl bg-stone-200"
              />
              {photo.title && (
                <figcaption className="mt-2 text-sm text-stone-500 transition-colors group-hover:text-stone-900">
                  {photo.title}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
