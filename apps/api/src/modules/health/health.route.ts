import { healthResponseSchema } from '@heatshift/shared';
import type { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { pingDatabase } from '../../db/client';

const startedAt = Date.now();

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Unversioned on purpose: load balancers and Docker health checks point here.
  app.get('/health', async (_request, reply) => {
    const database = await pingDatabase();
    const payload = {
      status: database === 'up' ? ('ok' as const) : ('degraded' as const),
      service: 'heatshift-api',
      version: process.env.npm_package_version ?? '0.0.0',
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      database,
      timestamp: new Date().toISOString(),
    };

    // Guard against contract drift without pulling in a runtime validator cost.
    healthResponseSchema.parse(payload);
    return reply.status(database === 'up' ? 200 : 503).send(payload);
  });
}
