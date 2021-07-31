import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import permissionsGetAvailableHandler from './available';
import permissionsDeleteHandler from './delete';
import permissionsGetHandler from './get';
import permissionsPostHandler from './post';

export function appPermissionsPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', permissionsGetHandler);
  app.post('/', permissionsPostHandler);
  app.delete('/', permissionsDeleteHandler);

  app.get('/available', permissionsGetAvailableHandler);

  done();
}
