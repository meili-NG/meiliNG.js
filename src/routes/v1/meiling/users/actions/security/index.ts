import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import userPasswordsPlugin from './passwords';

function userSecurityPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.register(userPasswordsPlugin, { prefix: '/passwords' });

  done();
}

export default userSecurityPlugin;
