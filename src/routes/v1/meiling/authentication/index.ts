import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { meilingV1SessionAuthnIssueHandler } from './issue';
import { meilingV1SessionAuthnVerifyHandler } from './verify';

export function meilingV1SessionAuthnPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.post('/issue', meilingV1SessionAuthnIssueHandler);
  app.post('/verify', meilingV1SessionAuthnVerifyHandler);

  done();
}
