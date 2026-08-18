import { app } from './app.ts';
import { env } from './env/index.ts';

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log(`🚀 Servidor Fastify rodando nativamente no Node 24 (Porta ${env.PORT})`);
});