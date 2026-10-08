import {
  API_PREFIX,
  heatRiskPreviewRequestSchema,
  heatRiskPreviewResponseSchema,
} from '@heatshift/shared';
import type { FastifyInstance } from 'fastify';
import { computeHeatRisk } from './heat-risk.model';

export async function heatRiskRoutes(app: FastifyInstance): Promise<void> {
  app.post(`${API_PREFIX}/heat-risk/preview`, async (request, reply) => {
    const input = heatRiskPreviewRequestSchema.parse(request.body);
    const result = computeHeatRisk(input);
    return reply.send(heatRiskPreviewResponseSchema.parse({ data: result }));
  });
}
