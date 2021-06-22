import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { NodeEnvironment } from '../interface';
import config from '../resources/config';
import { info as packageJson } from '../resources/package';
import v1Plugin from './v1';

function meilingPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.route({
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'],
    url: '/',
    handler: handleRoot,
  });

  app.register(v1Plugin, { prefix: '/v1' });

  done();
}

// ======

function handleRoot(req: FastifyRequest, rep: FastifyReply): void {
  const easteregg = {
    about: {
      name: packageJson.name,
      description: packageJson.description,
      repository: packageJson.repository,
      version: config.node.environment === NodeEnvironment.Development ? packageJson.version : undefined,
    },
    isDevelopment: config.node.environment === NodeEnvironment.Development,
  };

  const helloWorld = {
    hello: 'world',
    ...easteregg,
  };

  rep.send(helloWorld);
}

export default meilingPlugin;
