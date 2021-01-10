import { FastifyInstance, FastifyReply } from 'fastify';
import { buildErrorCodeURL } from '../../../common';
import { oAuth2AuthHandler } from './auth';
import { OAuth2ErrorResponseType } from './interfaces';
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
