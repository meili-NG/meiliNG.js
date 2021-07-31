import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import user2FAPlugin from './2fa';
import userPasswordsPlugin from './passwords';

function userSecurityPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.register(userPasswordsPlugin, { prefix: '/passwords' });
  app.register(user2FAPlugin, { prefix: '/2fa' });

  done();
}

export default userSecurityPlugin;
