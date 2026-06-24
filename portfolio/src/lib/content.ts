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
  url: string;
  /** Fallback icon when no image is provided */
  emoji: string;
  /** Path under /public, e.g. "/apps/city-budget-simulator.png" */
  image?: string;
  tags: string[];
  featured: boolean;
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
    title: "No-Code & Rapid Prototyping",
    description:
      "Shipping functional prototypes in days, not months, to test assumptions with real users.",
  },
  {
    title: "Website & UX Design",
    description:
      "Designing user-centric experiences that convert — from landing pages to full product flows.",
  },
];

/** Apps and products you've built — add new entries here */
export const apps: App[] = [
  {
    slug: "city-budget-simulator",
    name: "City Budget Simulator",
    description:
      "Turn-based game: balance the budget, delay consequences, and survive 30 years in office.",
    url: "https://ganciatx.com/city-budget-simulator",
    emoji: "🏛️",
    image: "/apps/city-budget-simulator.png",
    tags: ["Game", "Simulator"],
    featured: true,
  },
  {
    slug: "tally",
    name: "Tally",
    description:
      "Keep track of your game scores and track your friendly competitions.",
    url: "https://tally.ganciatx.com/",
    emoji: "🔥",
    tags: ["Game", "Scoring"],
    featured: true,
  },
  {
    slug: "notion-pack",
    name: "Notion Component Pack",
    description:
      "A customizable Notion template pack for portfolios, landing pages, and personal sites.",
    url: "https://example.com/notion-pack",
    emoji: "📦",
    tags: ["Templates", "Design"],
    featured: true,
  },
  {
    slug: "feedback-loop",
    name: "Feedback Loop",
    description:
      "Collect and organize user feedback from multiple channels into actionable product insights.",
    url: "https://example.com/feedback-loop",
    emoji: "💬",
    tags: ["Research", "SaaS"],
    featured: false,
  },
  {
    slug: "launchpad",
    name: "LaunchPad",
    description:
      "Pre-launch waitlist builder with referral mechanics and analytics for early-stage products.",
    url: "https://example.com/launchpad",
    emoji: "🚀",
    tags: ["Growth", "Marketing"],
    featured: false,
  },
  {
    slug: "metric-dash",
    name: "Metric Dash",
    description:
      "Simple analytics dashboard that connects to your product data and surfaces the metrics that matter.",
    url: "https://example.com/metric-dash",
    emoji: "📊",
    tags: ["Analytics", "Dashboard"],
    featured: false,
  },
];

export function getFeaturedApps(): App[] {
  return apps.filter((app) => app.featured);
}

export function getAllApps(): App[] {
  return apps;
}

export function getAppBySlug(slug: string): App | undefined {
  return apps.find((app) => app.slug === slug);
}
