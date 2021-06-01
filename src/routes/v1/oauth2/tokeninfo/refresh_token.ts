import { FastifyReply } from 'fastify';
import { Token } from '../../../../common';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType } from '../interfaces';

export async function refreshTokenInfoHandler(token: string, rep: FastifyReply): Promise<void> {
  const type = 'REFRESH_TOKEN';

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
    refresh_token: data.token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    scope: data.scope,
  });
}
