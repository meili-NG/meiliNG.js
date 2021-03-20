import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import meilingV1UserAppInfoHandler from './get';
import meilingV1UserAppListHandler from './list';

export function meilingV1UserAppsPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', meilingV1UserAppListHandler);
  app.get('/:clientId', meilingV1UserAppInfoHandler);

  done();
}
