import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import user2FAEnablePlugin from './enable';
import get2FAInfo from './get';

function user2FAPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', get2FAInfo);
  app.register(user2FAEnablePlugin, { prefix: '/enable' });

  done();
}

export default user2FAPlugin;
