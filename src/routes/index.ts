import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { isDevelopment, VERSION } from '..';
import { registerV1Endpoints } from './v1';
import { registerV1OAuth2Endpoints } from './v1/oauth2';

export function registerRootEndpoints(app: FastifyInstance, baseURI: string) {
  app.route({
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'],
    url: baseURI,
    handler: handleRoot,
  });

  registerV1Endpoints(app, baseURI + 'v1');

  // Google Compatibility
  registerV1OAuth2Endpoints(app, baseURI + 'o/oauth2/v2');
}

// ======

const easteregg = {
  about: {
    name: 'meiling',
    description: 'An easy-to-use, open-source oAuth2 Authentication Provider',
    version: VERSION,
    repository: 'https://github.com/Stella-IT/meiling',
  },
  poweredBy: {
    gatekeeperEngine: 'Scarlet Mansion Access Control, ver. 0.1.6',
    qiEngine: 'Qi Engine, ver. 0.2.4; Compatible with Qi Standard ver.1.2.4',
  },
  developmentMode: true,
};

function handleRoot(req: FastifyRequest, rep: FastifyReply) {
  const helloWorld = {
    hello: 'world',
    ...(isDevelopment ? easteregg : {}),
  };

  rep.send(helloWorld);
}
