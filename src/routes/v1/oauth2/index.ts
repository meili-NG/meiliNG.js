import { FastifyInstance } from 'fastify';
import { oAuth2AuthHandler } from './auth';
import { oAuth2TokenHandler } from './token';
import { oAuth2TokenInfoHandler } from './tokeninfo';
import { oAuth2UserInfoHandler } from './userinfo';

export function registerV1OAuth2Endpoints(app: FastifyInstance) {
  app.get('/', (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Project',
      api: 'oAuth2 Endpoints',
    });
  });

  app.get('/auth', oAuth2AuthHandler);
  app.post('/token', oAuth2TokenHandler);
  app.route({
    method: ['GET', 'POST'],
    url: '/tokeninfo',
    handler: oAuth2TokenInfoHandler,
  });
  app.route({
    method: ['GET', 'POST'],
    url: '/userinfo',
    handler: oAuth2UserInfoHandler,
  });
}
