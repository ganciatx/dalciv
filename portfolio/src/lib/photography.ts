import fs from "fs";
import path from "path";
import YAML from "yaml";

/** A single exhibit photo; width/height are the source pixel dimensions */
export interface Photo {
  src: string;
  alt: string;
  title?: string;
  width: number;
  height: number;
}

const PHOTOGRAPHY_YAML = path.join(process.cwd(), "content/photography.yaml");

/** All exhibit photos in display order */
export function getAllPhotos(): Photo[] {
  const raw = fs.readFileSync(PHOTOGRAPHY_YAML, "utf-8");
  return (YAML.parse(raw) as { photos: Photo[] }).photos;
}
