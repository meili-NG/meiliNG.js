import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { meilingV1AuthorizationIssueHandler } from './issue';
import { meilingV1AuthorizationVerifyHandler } from './verify';

export function meilingV1AuthorizationPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.post('/issue', meilingV1AuthorizationIssueHandler);
  app.post('/verify', meilingV1AuthorizationVerifyHandler);

  done();
}
