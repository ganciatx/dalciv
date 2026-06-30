import fs from "fs";
import path from "path";
import YAML from "yaml";

/**
 * Site content loader — edit portfolio/content/site.yaml, not this file.
 * Blog posts remain in content/blog/*.md (see lib/blog.ts).
 */

export interface SiteConfig {
  name: string;
  title: string;
  tagline: string;
  location: string;
  bio: string;
  email: string;
  social: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

export interface Service {
  title: string;
  description: string;
}

export interface App {
  slug: string;
  name: string;
  description: string;
  url: string;
  emoji: string;
  image?: string;
  tags: string[];
  featured: boolean;
  external?: boolean;
}

export interface SectionCopy {
  label: string;
  title: string;
  description: string;
}

export interface HeroCopy {
  primaryCta: string;
  secondaryCta: string;
  secondaryHref: string;
}

export interface SiteSections {
  hero: HeroCopy;
  services: SectionCopy;
  sideProjects: SectionCopy;
  blog: SectionCopy;
  contact: SectionCopy;
}

interface SiteYaml {
  site: SiteConfig;
  sections: {
    hero: HeroCopy;
    services: Omit<SectionCopy, "description"> & { description?: string };
    sideProjects: SectionCopy;
    blog: SectionCopy;
    contact: SectionCopy;
  };
  services: Service[];
  apps: App[];
}

const SITE_YAML = path.join(process.cwd(), "content/site.yaml");

function loadSiteYaml(): SiteYaml {
  if (!fs.existsSync(SITE_YAML)) {
    throw new Error(`Missing site content file: ${SITE_YAML}`);
  }
  return YAML.parse(fs.readFileSync(SITE_YAML, "utf-8")) as SiteYaml;
}

const data = loadSiteYaml();

export const siteConfig: SiteConfig = data.site;

function resolveSection(
  section: SiteYaml["sections"]["services"],
  fallbackDescription: string,
): SectionCopy {
  return {
    label: section.label,
    title: section.title,
    description: section.description?.trim()
      ? section.description.trim()
      : fallbackDescription,
  };
}

export const sections: SiteSections = {
  hero: data.sections.hero,
  services: resolveSection(data.sections.services, data.site.bio),
  sideProjects: data.sections.sideProjects,
  blog: data.sections.blog,
  contact: data.sections.contact,
};

export const services: Service[] = data.services;
export const apps: App[] = data.apps;

export function isExternalApp(app: App): boolean {
  return app.external ?? /^https?:\/\//i.test(app.url);
}

export function getFeaturedApps(): App[] {
  return apps.filter((app) => app.featured);
}

export function getAllApps(): App[] {
  return apps;
}

export function getAppBySlug(slug: string): App | undefined {
  return apps.find((app) => app.slug === slug);
}
