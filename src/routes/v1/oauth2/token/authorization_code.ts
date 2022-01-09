import crypto from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Meiling, Utils } from '../../../../common';
import { parseClientInfo } from '../common';

export async function oAuth2AuthorizationCodeHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const result = parseClientInfo(req);

  if (!result) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_CLIENT, 'invalid client id');
    return;
  }

  const { clientId, clientSecret } = result;
  const body = req.body as Meiling.OAuth2.Interfaces.OAuth2QueryTokenAuthorizationCodeParameters;

  const token = body.code;
  const type = 'AUTHORIZATION_CODE';

  if (!(await Meiling.OAuth2.Client.getByClientId(clientId))) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_CLIENT, 'invalid client id');
    return;
  }

  if (!(await Meiling.OAuth2.Client.verifySecret(clientId, clientSecret))) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_CLIENT, 'invalid client secret');
    return;
  }

  // check token is valid
  if (!Utils.isValidValue(token)) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_REQUEST, 'invalid token');
    return;
  }

  const data = await Meiling.Authorization.Token.getData(token);
  if (data?.type !== type) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_GRANT, 'invalid token type');
    return;
  }

  if (!(await Meiling.Authorization.Token.isValid(token, type))) {
    const expiresIn = await Meiling.Authorization.Token.getExpiresIn(token, type);
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'expired token, expired seconds: ' + expiresIn,
    );
    return;
  }

  // get user
  const user = await Meiling.Authorization.Token.getUser(token, type);
  if (!user) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'unable to find user to authenticate',
    );
    return;
  }

  const authorization = await Meiling.Authorization.Token.getAuthorization(token, type);
  if (!authorization) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'unable to find proper authorization session',
    );
    return;
  }

  const permissions = await Meiling.Authorization.Token.getAuthorizedPermissions(token, type);
  if (!permissions) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_REQUEST,
      'unable to find permissions to authenticate',
    );
    return;
  }

  const scopes = permissions.map((p) => p.name);
  const scope = scopes.join(' ');
  const metadata = await Meiling.Authorization.Token.getMetadata(token, type);

  // refresh thing
  let nonce = undefined;
  let needRefreshToken = false;

  // doing manual casting because typescript compiler
  // doesn't know xxxx about types
  if ((metadata as Meiling.Authorization.Token.TokenMetadataV1)?.version === 1) {
    const metadataV1 = metadata as Meiling.Authorization.Token.TokenMetadataV1;

    needRefreshToken = metadataV1.options?.offline !== undefined;

    if (metadataV1.options?.code_challenge) {
      const challenge = metadataV1.options.code_challenge;
      if (body.code_verifier) {
        const code_verifier = body.code_verifier;
        if (challenge.method === 'plain') {
          if (challenge.challenge !== code_verifier) {
            Meiling.OAuth2.Error.sendOAuth2Error(
              rep,
              Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
              'invalid code_verifier',
            );
            return;
          }
        } else if (challenge.method === 'S256') {
          const verifierHashed = crypto.createHash('sha256').update(code_verifier).digest('base64');
          const codeVerifierBase64 = Buffer.from(challenge.challenge, 'base64').toString('base64');

          if (codeVerifierBase64 !== verifierHashed) {
            Meiling.OAuth2.Error.sendOAuth2Error(
              rep,
              Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
              'invalid code_verifier',
            );
            return;
          }
        } else {
          Meiling.OAuth2.Error.sendOAuth2Error(
            rep,
            Meiling.OAuth2.Error.ErrorType.UNSUPPORTED_GRANT_TYPE,
            'unsupported PKCE method',
          );
          return;
        }
      } else {
        Meiling.OAuth2.Error.sendOAuth2Error(
          rep,
          Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
          'code_verifier is missing',
        );
        return;
      }
    }

    if (metadataV1.options?.openid) {
      if (metadataV1.options.openid.nonce) {
        nonce = metadataV1.options.openid.nonce;
      }
    }
  }

  /*
  if (!needRefreshToken) {
    const unauthorizedPermissions = await Client.getUnauthorizedPermissions(user, clientId, permissions);
    if (unauthorizedPermissions) {
      needRefreshToken = unauthorizedPermissions.length > 0;
    }
  }
  */

  const access_token = await Meiling.OAuth2.ClientAuthorization.createToken(authorization, 'ACCESS_TOKEN');

  let refresh_token = undefined;
  if (needRefreshToken) {
    refresh_token = await Meiling.OAuth2.ClientAuthorization.createToken(authorization, 'REFRESH_TOKEN');
  }

  rep
    .headers({
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    })
    .send({
      access_token: access_token.token,
      scope,
      refresh_token: refresh_token?.token,
      token_type: 'Bearer',
      expires_in: Meiling.Authorization.Token.getValidTimeByType('ACCESS_TOKEN'),
      id_token: scopes.includes('openid')
        ? await Meiling.Identity.User.createIDToken(user, clientId, scopes, nonce)
        : undefined,
    });
}
