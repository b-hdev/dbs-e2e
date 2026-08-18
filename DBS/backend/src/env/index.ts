import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),

  IXC_API_URL: z.url(),
  IXC_API_TOKEN: z.string(),
  IXC_API_USER: z.string(),

  AI_API_KEY: z.string(),
  AI_MODEL: z.string().default("qwen3-30b-a3b-fp8"),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables.");
}

export const env = _env.data;