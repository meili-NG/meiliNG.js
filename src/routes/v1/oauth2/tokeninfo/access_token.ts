import { FastifyReply } from 'fastify';
import { Token } from '../../../../common';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType } from '../interfaces';

export async function oAuth2AccessTokenInfoHandler(token: string, rep: FastifyReply) {
  const type = 'ACCESS_TOKEN';

  if (!(await Token.isValid(token, type))) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'token is expired');
    return;
  }

  const data = await Token.serialize(token, type);
  if (!data) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'invalid token');
    return;
  }

  rep.send({
    access_token: data.token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    scope: data.scope,
  });
}
