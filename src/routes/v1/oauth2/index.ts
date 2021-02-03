import { FastifyInstance } from 'fastify';
import { oAuth2AuthHandler } from './auth';
import { oAuth2TokenHandler } from './token';

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
  app.get('/userinfo', oAuth2TokenHandler);
}
