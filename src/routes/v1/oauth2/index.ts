import { FastifyInstance, FastifyReply } from 'fastify';
import { buildErrorCodeURL } from '../../../common';
import { oAuth2AuthHandler } from './auth';
import { OAuth2ErrorResponseError } from './interfaces';
import { oAuth2TokenHandler } from './token';

export function sendOAuth2Error(
  rep: FastifyReply,
  error: OAuth2ErrorResponseError,
  description?: string,
  errorCode?: string,
) {
  let statusCode = 500;
  if (error === 'invalid_request') {
    statusCode = 400;
  } else if (error === 'invalid_client') {
    statusCode = 401;
  } else if (error === 'invalid_grant') {
    statusCode = 403;
  } else if (error === 'unauthorized_client') {
    statusCode = 400;
  } else if (error === 'unsupported_grant_type') {
    statusCode = 503;
  } else if (error === 'invalid_scope') {
    statusCode = 400;
  }

  rep.status(statusCode).send({
    error,
    error_description: description,
    url: buildErrorCodeURL(errorCode),
  });
}

export function registerV1OAuth2Endpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI + '/auth', oAuth2AuthHandler);
  app.get(baseURI + '/token', oAuth2TokenHandler);
}
