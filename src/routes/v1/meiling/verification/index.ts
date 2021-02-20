import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { meilingV1VerificationHandler } from './verification';

export function v1MeilingVerificationPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/:method', meilingV1VerificationHandler);
  app.post('/:method', meilingV1VerificationHandler);

  done();
}
