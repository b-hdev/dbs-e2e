import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  IXC_API_URL: z.url({ message: "invalid url" }),
  IXC_API_TOKEN: z.string().min(1, { message: "Invalid Token" }),
  IXC_API_USER: z.string().min(1, { message: "Invalid userid" }),

  AI_API_KEY: z.string().min(1, { message: "Invalid API Key" }),
  AI_MODEL: z.string().default('qwen3-30b-a3b-fp8'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid Enviroment variables', z.treeifyError(_env.error));
  throw new Error('Invalid Enviroment variables. Please check your .env file');
}

export const env = _env.data;

