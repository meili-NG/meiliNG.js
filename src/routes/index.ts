import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { isDevelopment, packageJson } from '..';

import v1Plugin from './v1';

function meilingPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.route({
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'],
    url: '/',
    handler: handleRoot,
  });

  app.register(v1Plugin, { prefix: '/v1' });

  done();
}

// ======

function handleRoot(req: FastifyRequest, rep: FastifyReply) {
  const easteregg = {
    about: {
      name: packageJson.name,
      description: packageJson.description,
      repository: packageJson.repository,
      version: isDevelopment ? packageJson.version : undefined,
    },
    poweredBy: packageJson.poweredBy,
    isDevelopment,
  };

  const helloWorld = {
    hello: 'world',
    ...easteregg,
  };

  rep.send(helloWorld);
}

export default meilingPlugin;
