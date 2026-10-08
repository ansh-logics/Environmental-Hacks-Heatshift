import { API_PREFIX, listReliefPointsQuerySchema } from '@heatshift/shared';
import type { FastifyInstance } from 'fastify';
import { listReliefPoints } from './relief-points.service';

export async function reliefPointRoutes(app: FastifyInstance): Promise<void> {
  app.get(`${API_PREFIX}/relief-points`, async (request, reply) => {
    const query = listReliefPointsQuerySchema.parse(request.query);
    return reply.send(await listReliefPoints(query));
  });
}
