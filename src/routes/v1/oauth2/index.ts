import { FastifyInstance } from 'fastify';
import { oAuth2AuthHandler } from './auth';
import { oAuth2TokenHandler } from './token';

export function registerV1OAuth2Endpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Engine',
      api: 'oAuth2 Endpoints',
    });
  });

  app.get(baseURI + '/auth', oAuth2AuthHandler);
  app.get(baseURI + '/token', oAuth2TokenHandler);
}
