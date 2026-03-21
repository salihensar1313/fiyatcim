import { z } from "zod";
import { logger } from "@/lib/logger";

const envSchema = z.object({
  // Demo Mode
  NEXT_PUBLIC_DEMO_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // Payment (optional until Sprint 4)
  IYZICO_API_KEY: z.string().optional(),
  IYZICO_SECRET_KEY: z.string().optional(),
  IYZICO_BASE_URL: z.string().url().optional(),

  // Analytics
  NEXT_PUBLIC_GA_ID: z.string().optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    logger.error("invalid_env_vars", { fn: "validateEnv", error: JSON.stringify(parsed.error.flatten().fieldErrors) });
    throw new Error("Invalid environment variables. Check .env.example for required values.");
  }

  return parsed.data;
}

export const env = validateEnv();

// Type-safe exports
export const IS_DEMO_MODE = env.NEXT_PUBLIC_DEMO_MODE;
export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
