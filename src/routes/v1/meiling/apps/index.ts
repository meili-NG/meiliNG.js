import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import meilingV1AppDeleteHandler from './delete';
import meilingV1AppHandler from './get';
import meilingV1AppPostHandler from './post';

export function meilingV1AppsPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', meilingV1AppHandler);
  app.post('/', meilingV1AppPostHandler);

  app.get('/:clientId', meilingV1AppHandler);
  app.delete('/:clientId', meilingV1AppDeleteHandler);

  done();
}
