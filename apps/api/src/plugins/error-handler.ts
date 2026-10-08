import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { UpstreamError } from '../lib/errors';

/** Uniform error envelope: { error: { code, message, details? } }. */
export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url.split('?')[0]} does not exist`,
      },
    });
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request did not match the shared schema',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
      return;
    }

    const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;

    if (error instanceof UpstreamError) {
      // The provider is the failure, not us: log the cause, answer with the
      // status the caller can act on.
      reply.request.log.warn({ err: error }, 'Weather provider unavailable');
      reply.status(status).send({
        error: { code: error.code, message: error.message },
      });
      return;
    }

    if (status >= 500) {
      reply.request.log.error(error, 'Unhandled route error');
      reply.status(500).send({
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side' },
      });
      return;
    }

    reply.status(status).send({
      error: {
        code: 'REQUEST_FAILED',
        message: error.message,
      },
    });
  });
}
