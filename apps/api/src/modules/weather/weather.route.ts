import {
  API_PREFIX,
  weatherConditionsQuerySchema,
  weatherConditionsResponseSchema,
} from '@heatshift/shared';
import type { FastifyInstance } from 'fastify';
import { getCurrentConditions } from './weather.service';

export async function weatherRoutes(app: FastifyInstance): Promise<void> {
  app.get(`${API_PREFIX}/weather/conditions`, async (request, reply) => {
    const { latitude, longitude } = weatherConditionsQuerySchema.parse(request.query);
    const observation = await getCurrentConditions({ latitude, longitude });
    return reply.send(weatherConditionsResponseSchema.parse({ data: observation }));
  });
}
