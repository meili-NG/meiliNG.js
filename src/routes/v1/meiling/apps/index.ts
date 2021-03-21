import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import meilingV1AppInfoHandler from './get';
import meilingV1AppListHandler from './list';

export function meilingV1AppsPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', meilingV1AppListHandler);
  app.get('/:clientId', meilingV1AppInfoHandler);

  done();
}
