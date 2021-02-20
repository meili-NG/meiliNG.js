import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { meilingV1VerificationHandler } from './verification';

export function v1MeilingVerificationPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', meilingV1VerificationHandler);
  app.post('/', meilingV1VerificationHandler);

  done();
}
