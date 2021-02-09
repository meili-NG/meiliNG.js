import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { isDevelopment, packageJson } from '..';
import { registerV1Endpoints } from './v1';

export function registerRootEndpoints(app: FastifyInstance, baseURI: string) {
  app.route({
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'],
    url: baseURI,
    handler: handleRoot,
  });

  registerV1Endpoints(app, baseURI + 'v1');
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
    developmentMode: false,
  };

  const helloWorld = {
    hello: 'world',
    ...easteregg,
  };

  rep.send(helloWorld);
}
