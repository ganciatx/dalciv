import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

/** Fail closed — never ship with a hardcoded fallback (security audit C2). */
function authSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim() ?? "";
  if (secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET must be set and at least 32 characters (openssl rand -base64 32)",
    );
  }
  return secret;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  experimental: { joins: true },
  emailAndPassword: {
    enabled: true,
  },
  secret: authSecret(),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  ].filter(Boolean),
  plugins: [
    nextCookies(),
    // Block invitation accept/reject from unverified email sessions (GHSA-fmh4).
    organization({
      requireEmailVerificationOnInvitation: true,
    }),
  ],
});
