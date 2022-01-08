import { FastifyReply } from 'fastify';
import { Meiling } from '../../../../common';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType } from '../interfaces';

export async function accessTokenInfoHandler(token: string, rep: FastifyReply): Promise<void> {
  const type = 'ACCESS_TOKEN';

  if (!(await Meiling.Authorization.Token.isValid(token, type))) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'token is expired');
    return;
  }

  const data = await Meiling.Authorization.Token.serialize(token, type);
  if (!data) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'invalid token');
    return;
  }

  rep
    .headers({
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    })
    .send({
      access_token: data.token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
    });
}
