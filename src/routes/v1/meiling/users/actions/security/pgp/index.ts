import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import userPGPPostKeys from './post';
import userPGPGetKeys from './get';
import userPGPActionsPlugin from './actions';

function userPGPPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', userPGPGetKeys);
  app.post('/', userPGPPostKeys);

  app.register(userPGPActionsPlugin, { prefix: '/:pgpId' });

  done();
}

export default userPGPPlugin;
