import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import appInfoHandler from './get';
import appListHandler from './list';

export function appsPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', appListHandler);
  app.get('/:clientId', appInfoHandler);

  done();
}
