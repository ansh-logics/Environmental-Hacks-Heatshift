import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env';

export async function registerCors(app: FastifyInstance): Promise<void> {
  const origins = env.CORS_ORIGIN.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  await app.register(cors, {
    origin: origins,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false,
    maxAge: 600,
  });
}
