import fastify from 'fastify';
import { env } from './env/index.ts';
import cors from '@fastify/cors';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { setupErrorHandler } from './errors/errorHandler.ts';
import { APP_VERSION } from './utils/version.ts';
import { createLoggerConfig } from './utils/logger.ts';
import { identifyRoute } from './routes/identify.ts';
import { chatRoute } from './routes/chat.ts';

export const app = fastify({ logger: createLoggerConfig() }).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cors, {
  origin: true,
});

setupErrorHandler(app, {
  serviceName: 'DBS Telecom API',
  enableDetailedErrorLogging: true,
});

app.register(identifyRoute);
app.register(chatRoute);

app.get('/health', async () => {
  return { status: 'ok', version: APP_VERSION, timestamp: new Date().toISOString() };
});