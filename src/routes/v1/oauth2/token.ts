import { OAuthToken, OAuthClientAuthorization, OAuthTokenType } from '@prisma/client';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { config, prisma } from '../../..';
import { OAuth2QueryTokenParameters } from './interfaces';
import { sendOAuth2Error } from './index';

export async function oAuth2TokenHandler(req: FastifyRequest, rep: FastifyReply) {
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
