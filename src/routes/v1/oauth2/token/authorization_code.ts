import crypto from 'crypto';
import { FastifyReply } from 'fastify';
import { Client, ClientAuthorization, Token, User, Utils } from '../../../../common';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType, OAuth2QueryTokenAuthorizationCodeParameters } from '../interfaces';

export async function oAuth2AuthorizationCodeHandler(
  body: OAuth2QueryTokenAuthorizationCodeParameters,
  rep: FastifyReply,
) {
  const clientId = body.client_id;

  const token = body.code;
  const type = 'AUTHORIZATION_CODE';

  // check token is valid
  if (!Utils.isValidValue(token)) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'invalid token');
    return;
  }

  const data = await Token.getData(token);
  if (data?.type !== type) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'invalid token type');
    return;
  }

  if (!(await Token.isValid(token, type))) {
    const expiresIn = await Token.getExpiresIn(token, type);
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'expired token, expired seconds: ' + expiresIn);
    return;
  }

  // get user
  const user = await Token.getUser(token, type);
  if (!user) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'unable to find user to authenticate');
    return;
  }

  const authorization = await Token.getAuthorization(token, type);
  if (!authorization) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'unable to find proper authorization session');
    return;
  }

  const permissions = await Token.getAuthorizedPermissions(token, type);
  if (!permissions) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'unable to find permissions to authenticate');
    return;
  }

  const scopes = permissions.map((p) => p.name);
  const scope = scopes.join(' ');
  const metadata = await Token.getMetadata(token, type);

  // refresh thing
  let nonce = undefined;
  let needRefreshToken = false;

  // doing manual casting because typescript compiler
  // doesn't know xxxx about types
  if ((metadata as Token.TokenMetadataV1)?.version === 1) {
    const metadataV1 = metadata as Token.TokenMetadataV1;

    needRefreshToken = metadataV1.options?.offline !== undefined;

    if (metadataV1.options?.code_challenge) {
      const challenge = metadataV1.options.code_challenge;
      if (body.code_verifier) {
        const code_verifier = body.code_verifier;
        if (challenge.method === 'plain') {
          if (challenge.challenge !== code_verifier) {
            sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'invalid code_verifier');
            return;
          }
        } else if (challenge.method === 'S256') {
          const verifierHashed = crypto.createHash('sha256').update(code_verifier).digest('base64');
          const codeVerifierBase64 = Buffer.from(challenge.challenge, 'base64').toString('base64');

          if (codeVerifierBase64 !== verifierHashed) {
            sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'invalid code_verifier');
            return;
          }
        } else {
          sendOAuth2Error(rep, OAuth2ErrorResponseType.UNSUPPORTED_GRANT_TYPE, 'unsupported PKCE method');
          return;
        }
      } else {
        sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'code_verifier is missing');
        return;
      }
    }

    if (metadataV1.options?.openid) {
      if (metadataV1.options.openid.nonce) {
        nonce = metadataV1.options.openid.nonce;
      }
    }
  }

  if (!needRefreshToken) {
    const unauthorizedPermissions = await Client.getUnauthorizedPermissions(user, clientId, permissions);
    if (unauthorizedPermissions) {
      needRefreshToken = unauthorizedPermissions.length > 0;
    }
  }

  const access_token = await ClientAuthorization.createToken(authorization, 'ACCESS_TOKEN');

  let refresh_token = undefined;
  if (needRefreshToken) {
    refresh_token = await ClientAuthorization.createToken(authorization, 'REFRESH_TOKEN');
  }

  rep.send({
    access_token: access_token.token,
    scope,
    refresh_token: refresh_token?.token,
    token_type: 'Bearer',
    expires_in: Token.getValidTimeByType('ACCESS_TOKEN'),
    id_token: scopes.includes('openid') ? await User.createIDToken(user, clientId, scopes, nonce) : undefined,
  });
}
