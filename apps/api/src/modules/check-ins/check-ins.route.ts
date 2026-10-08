import {
  API_PREFIX,
  checkInSummaryQuerySchema,
  createCheckInSchema,
} from '@heatshift/shared';
import type { FastifyInstance } from 'fastify';
import { createCheckIn, summarizeCheckIns } from './check-ins.service';

export async function checkInRoutes(app: FastifyInstance): Promise<void> {
  app.post(`${API_PREFIX}/check-ins`, async (request, reply) => {
    const input = createCheckInSchema.parse(request.body);
    const checkIn = await createCheckIn(input);
    return reply.status(201).send({ data: checkIn });
  });

  app.get(`${API_PREFIX}/check-ins/summary`, async (request, reply) => {
    const query = checkInSummaryQuerySchema.parse(request.query);
    return reply.send(await summarizeCheckIns(query));
  });
}
