import { OAuthTokenType } from '@prisma/client';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { Client, ClientAuthorization, Token, User, Utils } from '../../../common';
import { sendOAuth2Error } from './error';
import { OAuth2ErrorResponseType, OAuth2QueryBodyParameters, OAuth2QueryGrantType } from './interfaces';

// TODO: https://developers.google.com/identity/protocols/oauth2/limited-input-device#step-4:-poll-googles-authorization-server
// TODO: https://developers.google.com/identity/protocols/oauth2/native-app#exchange-authorization-code

export async function oAuth2TokenHandler(req: FastifyRequest, rep: FastifyReply) {
  const body = req.body as OAuth2QueryBodyParameters;

  // validate query
  if (!Utils.isValidValue(body, body?.client_id, body?.client_secret, body?.grant_type)) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST);
    return;
  }

  // cget client
  const clientId = body.client_id;
  const client = await Client.getByClientId(clientId);

  if (client === null) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_CLIENT);
    return;
  }

  if (!Client.verifySecret(clientId, body.client_secret)) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_CLIENT);
    return;
  }

  // get token and type.
  let token;
  let type: OAuthTokenType;

  if (body.grant_type === OAuth2QueryGrantType.AUTHORIZATION_CODE) {
    token = body.code;
    type = 'AUTHORIZATION_CODE';
  } else if (body.grant_type === OAuth2QueryGrantType.REFRESH_TOKEN) {
    token = body.refresh_token;
    type = 'REFRESH_TOKEN';
  } else {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.UNSUPPORTED_GRANT_TYPE);
    return;
  }

  // check token is valid
  if (!Utils.isValidValue(token)) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST);
    return;
  }

  // get user
  const authorization = await Token.getAuthorization(token, type);
  if (!authorization) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'unable to find authorization to authenticate');
    return;
  }

  const user = await ClientAuthorization.getUser(authorization);
  if (!user) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'unable to find user to authenticate');
    return;
  }

  const permissions = await Token.getAuthorizedPermissions(token, type);
  if (!permissions) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'unable to find permissions to authenticate');
    return;
  }

  const scope = permissions.map((p) => p.name).join(' ');

  await User.updateLastAuthenticated(user);
  const metadata = await Token.getMetadata(token, type);

  let needRefreshToken = false;

  // doing manual casting because typescript compiler
  // doesn't know xxxx about types
  if ((metadata as Token.TokenMetadataV1)?.version === 1) {
    const metadataV1 = metadata as Token.TokenMetadataV1;

    needRefreshToken = metadataV1.shouldGenerate?.refreshToken !== undefined;
  }

  const authorizations = await User.getClientAuthorizations(user, clientId);

  if (authorizations) {
    const promises = [];
    const isValid = [];
    const validRefreshTokens = await User.getTokens(user, 'REFRESH_TOKEN');

    for (const refreshToken of validRefreshTokens) {
      promises.push(Token.getAuthorizedPermissions(refreshToken.token, refreshToken.type));
      isValid.push(Token.isValidByType(refreshToken.type, refreshToken.issuedAt));
    }

    const tokenPermissionsArray = await Promise.all(promises);

    let validContents = 0;
    for (let i = 0; i < validRefreshTokens.length; i++) {
      const tokenPermissions = tokenPermissionsArray[i];
      const isThisTokenValid = isValid[i];

      if (isThisTokenValid) {
        if (tokenPermissions) {
          if (
            permissions.filter((p) => tokenPermissions.filter((q) => p.name === q.name).length > 0).length ===
            permissions.length
          ) {
            validContents++;
          }
        }
      }
    }

    if (validContents === 0) {
      needRefreshToken = true;
    }
  } else {
    needRefreshToken = true;
  }

  const access_token = await ClientAuthorization.createToken(authorization, 'ACCESS_TOKEN');

  let refresh_token = undefined;
  if (needRefreshToken) {
    refresh_token = await ClientAuthorization.createToken(authorization, 'REFRESH_TOKEN');
  }

  rep.send({
    access_token,
    scope,
    refresh_token,
    token_type: 'Bearer',
    expires_in: Token.getValidTimeByType('ACCESS_TOKEN'),
  });
}
