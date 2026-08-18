import fastify from 'fastify';
import { env } from './env/index.ts';
import cors from '@fastify/cors';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { identifyRoute } from './routes/identify.ts';

export const app = fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cors, {
  origin: true,
});

app.register(identifyRoute);

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});