import { ConfigurationError } from "@/lib/domain-errors"
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

// CLI entry points and seed scripts do not receive Vite's automatic env load.
config({ path: [".env.local", ".env"], quiet: true });

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    APPLE_CLIENT_ID: z.string().min(1).optional(),
    APPLE_TEAM_ID: z.string().min(1).optional(),
    APPLE_KEY_ID: z.string().min(1).optional(),
    APPLE_PRIVATE_KEY: z.string().min(1).optional(),
    APPLE_APP_BUNDLE_IDENTIFIER: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    EMAIL_FROM: z.string().min(3).optional(),
    EMAIL_REPLY_TO: z.email().optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
    CLOUDFLARE_R2_PRIVATE_BUCKET_NAME: z.string().min(1),
    CLOUDFLARE_R2_PUBLIC_BUCKET_NAME: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    VERCEL_ENV: z
      .enum(["development", "preview", "production"])
      .optional(),
    SERVER_URL: z.url().optional(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "VITE_",

  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_PUBLIC_ASSET_URL: z.url(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: process.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
});

if (
  env.VERCEL_ENV === "production" &&
  /(^|[-_.])dev($|[-_.])/.test(
    env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME.toLowerCase(),
  )
) {
  throw new ConfigurationError({ category: "system", code: "CONFIGURATION_INVALID", debugMessage: "Production must use a dedicated R2 private bucket, not the development bucket." });
}
