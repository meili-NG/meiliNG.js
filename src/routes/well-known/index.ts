import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import openIdConfigurationHandler from './openid-configuration';

function wellKnownPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/openid-configuration', openIdConfigurationHandler);

  done();
}

export default wellKnownPlugin;
