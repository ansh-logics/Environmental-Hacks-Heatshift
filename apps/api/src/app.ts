import fastify from 'fastify';
import { API_PREFIX, APP_NAME } from '@heatshift/shared';
import { loggerOptions } from './lib/logger';
import { registerCors } from './plugins/cors';
import { registerErrorHandlers } from './plugins/error-handler';
import { healthRoutes } from './modules/health';
import { reliefPointRoutes } from './modules/relief-points';
import { checkInRoutes } from './modules/check-ins';
import { heatRiskRoutes } from './modules/heat-risk';

/**
 * App factory: no listen, no side effects, so tests and the boot script can
 * build the same instance.
 */
export async function buildApp() {
  const app = fastify({
    logger: loggerOptions,
    trustProxy: true,
    disableRequestLogging: process.env.NODE_ENV === 'production',
  });

  registerErrorHandlers(app);
  await registerCors(app);

  app.get('/', async (_request, reply) =>
    reply.send({
      name: APP_NAME,
      service: 'heatshift-api',
      health: '/health',
      endpoints: [
        `GET ${API_PREFIX}/relief-points`,
        `POST ${API_PREFIX}/check-ins`,
        `GET ${API_PREFIX}/check-ins/summary`,
        `POST ${API_PREFIX}/heat-risk/preview`,
      ],
    }),
  );

  await app.register(healthRoutes);
  await app.register(reliefPointRoutes);
  await app.register(checkInRoutes);
  await app.register(heatRiskRoutes);

  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;
