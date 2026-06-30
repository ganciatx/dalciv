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
    title: "Simplifying Complexity",
    description:
      "Tax law, compliance workflows, B2B onboarding — my specialty is taking the stuff nobody wants to deal with and making it slightly less painful.",
  },
  {
    title: "Rapid Prototyping",
    description:
      "Shipping functional prototypes in days, not months, to test assumptions with real users.",
  },
  {
    title: "Reading the Business",
    description:
      "I have an accounting degree, which mostly means I ask annoying questions about what we're actually measuring before we build anything.",
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
    slug: "crossword-constructor",
    name: "Crossword Constructor",
    description:
      "Build NYT- and WSJ-compliant crossword puzzles with live validation, word fill, and export.",
    url: "/crossword-constructor",
    emoji: "🧩",
    image: "/apps/crossword-constructor.png",
    tags: ["Game", "Utility"],
    featured: true,
  },
  {
    slug: "city-budget",
    name: "City Budget Explorer",
    description:
      "Interactive Dallas city budget — revenue sources, operating departments, and vendor spending.",
    url: "/city-budget",
    emoji: "📊",
    image: "/apps/budget-visual.png",
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
    image: "/apps/council-accountability.png",
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
    image: "/apps/police-map.png",
    tags: ["Civic", "Map"],
    featured: false,
  },
  {
    slug: "time-timer",
    name: "Time Timer",
    description:
      "Visual countdown timer for meetings, focus sessions, and classroom transitions.",
    url: "/time-timer",
    image: "/apps/timer.png",
    emoji: "⏱️",
    tags: ["Utility"],
    featured: false,
  },
  {
    slug: "breach-check",
    name: "Tax Identity Shield",
    description:
      "Trade-show demo: scan your email for breach exposure and learn how H&R Block protects your tax identity.",
    url: "/breach-check",
    emoji: "🛡️",
    tags: ["Demo", "Privacy"],
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
