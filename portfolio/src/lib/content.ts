/**
 * Central site configuration and app catalog.
 * Edit this file to personalize your portfolio without touching components.
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
  /** Absolute path on this site or full URL for external apps */
  url: string;
  /** Fallback icon when no image is provided */
  emoji: string;
  /** Path under /public, e.g. "/apps/city-budget-simulator.png" */
  image?: string;
  tags: string[];
  featured: boolean;
  /** Opens in a new tab when true (auto-set for https:// links) */
  external?: boolean;
}

/** Personal info — update with your details */
export const siteConfig: SiteConfig = {
  name: "Jackson Echols",
  title: "Product Manager & Maker",
  tagline:
    "I help teams ideate, validate, and ship digital products that people actually use.",
  location: "United States",
  bio: "I combine business strategy, user research, and hands-on building to turn ideas into products. From MVPs to scale, I focus on solving real problems for real users.",
  email: "hello@example.com",
  social: {
    linkedin: "https://linkedin.com/in/jackson-echols",
    github: "https://github.com/ganciatx",
    twitter: "https://twitter.com/yourusername",
  },
};

/** Expertise areas shown on the landing page */
export const services: Service[] = [
  {
    title: "Product Management",
    description:
      "Discovering products that are valuable, feasible, and usable by bridging business, tech, and design.",
  },
  {
    title: "Product Strategy",
    description:
      "Creating clear product vision, roadmaps, and go-to-market plans that align teams and stakeholders.",
  },
  {
    title: "MVPs & Validation",
    description:
      "Running lean experiments and smoke tests to validate ideas before investing in full builds.",
  },
  {
    title: "Customer Development",
    description:
      "Identifying the right problems to solve through interviews, surveys, and behavioral research.",
  },
  {
    title: "Rapid Prototyping",
    description:
      "Shipping functional prototypes in days, not months, to test assumptions with real users.",
  },
  {
    title: "Scrum Certified ",
    description:
      "Designing user-centric experiences that convert — from landing pages to full product flows.",
  },
];

/**
 * DalCiv side projects — live on this domain except Tally (subdomain).
 * URLs are site-relative so links work locally and in production.
 */
export const apps: App[] = [
  {
    slug: "city-budget-simulator",
    name: "City Budget Simulator",
    description:
      "Turn-based game: balance the budget, delay consequences, and survive 30 years in office.",
    url: "/city-budget-simulator",
    emoji: "🏛️",
    image: "/apps/city-budget-simulator.png",
    tags: ["Game", "Civic"],
    featured: true,
  },
  {
    slug: "city-budget",
    name: "City Budget Explorer",
    description:
      "Interactive Dallas city budget — revenue sources, operating departments, and vendor spending.",
    url: "/city-budget",
    emoji: "📊",
    tags: ["Civic", "Data"],
    featured: true,
  },
  {
    slug: "council-accountability",
    name: "Council Accountability",
    description:
      "Campaign finance, council voting records, and lobbyist registration for Dallas.",
    url: "/council-accountability",
    emoji: "⚖️",
    tags: ["Civic", "Data"],
    featured: true,
  },
  {
    slug: "tally",
    name: "Tally",
    description:
      "Keep track of game scores and friendly competitions with your group.",
    url: "https://tally.ganciatx.com/",
    emoji: "🔥",
    tags: ["Game", "Scoring"],
    featured: true,
    external: true,
  },
  {
    slug: "police",
    name: "Police Active Calls",
    description:
      "Live map of Dallas police active calls with geocoded incident locations.",
    url: "/police",
    emoji: "🗺️",
    tags: ["Civic", "Map"],
    featured: false,
  },
  {
    slug: "time-timer",
    name: "Time Timer",
    description:
      "Visual countdown timer for meetings, focus sessions, and classroom transitions.",
    url: "/time-timer",
    emoji: "⏱️",
    tags: ["Utility"],
    featured: false,
  },
];

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
