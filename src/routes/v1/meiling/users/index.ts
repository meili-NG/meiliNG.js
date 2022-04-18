import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { userActionsHandler } from './actions';
import { userGetLoggedInUserInfo } from './users';

export function userPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', userGetLoggedInUserInfo);

  app.register(userActionsHandler, { prefix: '/:userId' });

  done();
}
