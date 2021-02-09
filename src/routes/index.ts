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
  const eastereggDev = {
    about: {
      name: 'meiling',
      description: 'An easy-to-use, open-source oAuth2 Authentication Provider',
      version: packageJson.version,
      repository: packageJson.repository,
    },
    poweredBy: {
      gatekeeperEngine: 'Scarlet Mansion Access Control, ver. 0.1.6',
      qiEngine: 'Qi Engine, ver. 0.2.4; Compatible with Qi Standard ver.1.2.4; https://www.wirelesspowerconsortium.com',
    },
    developmentMode: true,
  };

  const easteregg = {
    about: {
      name: 'meiling',
      description: 'An easy-to-use, open-source oAuth2 Authentication Provider',
      repository: 'https://github.com/Stella-IT/meiling',
    },
    poweredBy: {
      gatekeeperEngine: 'Scarlet Mansion Access Control, ver. 0.1.6',
      qiEngine: 'Qi Engine, ver. 0.2.4; Compatible with Qi Standard ver.1.2.4',
    },
    developmentMode: false,
  };

  const helloWorld = {
    hello: 'world',
    ...(isDevelopment ? eastereggDev : easteregg),
  };

  rep.send(helloWorld);
}
