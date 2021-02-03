import { FastifyReply, FastifyRequest } from 'fastify';
import JWT from 'jsonwebtoken';
import { config } from '../../../';
import { Token, User } from '../../../common';
import { sendOAuth2Error } from './error';
import { OAuth2ErrorResponseType } from './interfaces';

export async function oAuthUserInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const type = 'ACCESS_TOKEN';

  const token = Token.getTokenFromRequest(req);
  if (!token) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'provided access_token is invalid');
    return;
  }

  const perms = await Token.getAuthorizedPermissions(token.token, type);
  const clientId = await Token.getClient(token.token, type);
  const user = await Token.getUser(token.token, type);
  if (!user || !perms || !clientId) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'provided access_token is invalid');
    return;
  }

  const scopes = perms.map((n) => n.name);

  const userData = await User.createIDToken(user, clientId.id, scopes);
  if (!userData) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'user matching access_token is missing');
    return;
  }

  try {
    const result = JWT.verify(userData, config.openid.secretKey) as any;
    rep.send(result);
  } catch (e) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'invalid id_token');
    return;
  }
}
