import { OAuthClientAuthorization, OAuthToken, OAuthTokenType } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { config, prisma } from '../..';
import {
  OAuth2ErrorResponse,
  OAuth2ErrorResponseError,
  OAuth2QueryAuthParameters,
  OAuth2QueryTokenParameters,
} from './interfaces';

export function registerV1OAuth2Endpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI + '/auth', oAuth2AuthHandler);
  app.get(baseURI + '/token', oAuth2TokenHandler);
}

function oAuth2AuthHandler(req: FastifyRequest, rep: FastifyReply) {
  const query = req.query as OAuth2QueryAuthParameters;

  /* 
    // Verification Mechanism
    
    const clientId = query?.client_id;
    const redirectUri = query?.redirect_uri;
    const responseType = query?.response_type;
    const scope = query?.scope;

    if (!(clientId && redirectUri && responseType && scope)) {
      rep.code(400).send('');
      return;
    } 
  */

  // ===

  let queryCount = 0;
  let str = '';

  for (const id in query) {
    const name = id as keyof OAuth2QueryAuthParameters;
    const value = (query as any)[id];

    str += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    queryCount++;
  }

  str = queryCount > 0 ? '?' + str.replace(/\&$/g, '') : '';

  const bestLogin = config.allowLogin[0];
  rep.redirect(302, bestLogin + '/auth' + str);
}

function sendOAuth2Error(rep: FastifyReply, error: OAuth2ErrorResponseError, description?: string, errorCode?: string) {
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
  });
}

async function oAuth2TokenHandler(req: FastifyRequest, rep: FastifyReply) {
  const query = req.query as OAuth2QueryTokenParameters;

  if (query.client_id === undefined || query.client_secret === undefined || query.grant_type === undefined) {
    sendOAuth2Error(rep, 'invalid_request');
    return;
  }

  const client = await prisma.oAuthClient.findUnique({
    where: {
      id: query.client_id,
    },
  });

  if (client === null) {
    sendOAuth2Error(rep, 'invalid_client');
    return;
  }

  let token: OAuthToken | null = null;
  let oAuthAuthorization: OAuthClientAuthorization | null = null;

  if (query.grant_type === 'authorization_code') {
    const code = query.code;
    token = await prisma.oAuthToken.findFirst({
      where: {
        type: OAuthTokenType.AUTHORIZATION_CODE,
        token: code,
      },
    });

    if (token === null) {
      sendOAuth2Error(rep, 'invalid_grant', 'provided authorization code is invalid or had been used.');
      return;
    }

    if (config?.invalidate?.AUTHORIZATION_CODE >= 0) {
      if (new Date().getTime() - token.issuedAt.getTime() > config.invalidate.AUTHORIZATION_CODE) {
        sendOAuth2Error(rep, 'invalid_grant', 'provided authorization code has been invalidated, please reissue one.');
        return;
      }
    }
  } else if (query.grant_type === 'refresh_token') {
    const refreshToken = query.refresh_token;
    token = await prisma.oAuthToken.findFirst({
      where: {
        type: OAuthTokenType.REFRESH_TOKEN,
        token: refreshToken,
      },
    });

    if (token === null) {
      sendOAuth2Error(rep, 'invalid_grant', 'provided refresh token is invalid or had been used.');
      return;
    }

    if (config?.invalidate?.REFRESH_TOKEN >= 0) {
      if (new Date().getTime() - token.issuedAt.getTime() > config.invalidate.REFRESH_TOKEN) {
        sendOAuth2Error(rep, 'invalid_grant', 'provided refresh token has been invalidated, please reissue one.');
        return;
      }
    }
  } else {
    sendOAuth2Error(rep, 'unsupported_grant_type');
    return;
  }

  oAuthAuthorization = (await prisma.oAuthClientAuthorization.findUnique({
    where: {
      id: token.oAuthClientAuthorizationId,
    },
  })) as OAuthClientAuthorization;

  if (oAuthAuthorization === null) {
    sendOAuth2Error(rep, 'invalid_grant', 'unable to find authorization request');
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: oAuthAuthorization.userId,
    },
  });

  if (user === null) {
    sendOAuth2Error(rep, 'invalid_grant', 'unable to find user to authenticate');
    return;
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastAuthenticated: new Date(),
    },
  });
}
