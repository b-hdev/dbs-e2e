import { app } from './app.ts';
import { env } from './env/index.ts';

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log(`Fastify server running natively on Node 24 (Port ${env.PORT})`);
});