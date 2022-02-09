import { FastifyReply } from 'fastify';
import { Meiling } from '../../../../common';

export async function refreshTokenInfoHandler(token: string, rep: FastifyReply): Promise<void> {
  const type = 'REFRESH_TOKEN';

  if (!(await Meiling.Authentication.Token.isValid(token, type))) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_GRANT, 'token is expired');
    return;
  }

  const data = await Meiling.Authentication.Token.serialize(token, type);
  if (!data) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_GRANT, 'invalid token');
    return;
  }

  rep
    .headers({
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    })
    .send({
      refresh_token: data.token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
    });
}
