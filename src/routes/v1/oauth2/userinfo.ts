import { FastifyReply, FastifyRequest } from 'fastify';
import JWT from 'jsonwebtoken';
import { Meiling } from '../../../common';
import * as Sentry from '@sentry/node';
import { isSentryAvailable } from '../../../common/sentry/tracer';
import { FastifyRequestWithUser } from '../meiling';

export async function oAuth2UserInfoHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const type = 'ACCESS_TOKEN';

  let token = Meiling.Authentication.Token.getTokenFromRequest(req);
  if (!token) {
    if (req.body) {
      const accessToken = (req.body as any).access_token;
      if (accessToken) {
        token = {
          method: 'Bearer',
          token: accessToken,
        };
      }
    }
  }

  if (!token) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'provided access_token is invalid',
    );
    return;
  }

  const perms = await Meiling.Authentication.Token.getAuthorizedPermissions(token.token, type);
  const clientId = await Meiling.Authentication.Token.getClient(token.token, type);
  const user = await Meiling.Authentication.Token.getUser(token.token, type);
  if (!user || !perms || !clientId) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'provided access_token is invalid',
    );
    return;
  }

  (req as FastifyRequestWithUser).user = user;

  const isValid = await Meiling.Authentication.Token.isValid(token.token, type);
  if (!isValid) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'provided access_token is expired',
    );
    return;
  }

  const scopes = perms.map((n) => n.name);
  if (!scopes.includes('openid')) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'provided access_token does NOT have openid permission',
    );
    return;
  }

  const userData = await Meiling.Identity.User.createIDToken(user, clientId.id, scopes);
  if (!userData) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'user matching access_token is missing',
    );
    return;
  }

  try {
    const result = JWT.decode(userData) as any;
    rep.send(result);
  } catch (e) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'invalid id_token has generated',
    );
    return;
  }
}
