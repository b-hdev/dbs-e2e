import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
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

// Segurança: Cabeçalhos HTTP defensivos (Helmet)
app.register(fastifyHelmet, {
  contentSecurityPolicy: false, // API JSON — desabilitado para evitar bloqueios de assets em clientes externos
  crossOriginEmbedderPolicy: false,
});

// Segurança: Rate Limiting global contra força bruta / DoS / scraping de CPF na IXC
app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: (_req, context) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Limite de requisições atingido. Tente novamente em ${context.after}.`,
    code: 'RATE_LIMIT_EXCEEDED',
  }),
});

// CORS: Permitir conexões do app mobile e web
app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});

// Tratamento centralizado de erros e sanitização
setupErrorHandler(app, {
  serviceName: 'DBS Telecom API',
  enableDetailedErrorLogging: true,
});

// Registro de rotas
app.register(identifyRoute);
app.register(chatRoute);

app.get('/health', async () => {
  return { status: 'ok', version: APP_VERSION, timestamp: new Date().toISOString() };
});

app.get('/health/live', async () => {
  return { status: 'ok', version: APP_VERSION, timestamp: new Date().toISOString() };
});