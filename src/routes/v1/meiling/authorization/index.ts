import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { meilingV1AuthorizationVerifyHandler } from './verify';

export function v1MeilingVerificationPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', meilingV1AuthorizationVerifyHandler);
  app.post('/', meilingV1AuthorizationVerifyHandler);

  done();
}
