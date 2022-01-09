import { FastifyReply } from 'fastify';
import JWT from 'jsonwebtoken';
import config from '../../../../resources/config';
import { Meiling } from '../../../../common';

export async function idTokenInfoHandler(token: string, rep: FastifyReply): Promise<void> {
  try {
    if (config.openid.jwt.publicKey?.key !== undefined) {
      const key =
        config.openid.jwt.publicKey.passphrase !== undefined
          ? {
              key: config.openid.jwt.publicKey.key,
              passphrase: config.openid.jwt.publicKey.passphrase,
            }
          : config.openid.jwt.publicKey.key;

      const result = JWT.verify(token, key, {
        issuer: config.openid.issuingAuthority,
      }) as any;

      if (new Date(result.exp).getTime() < new Date().getTime()) {
        Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_GRANT, 'id_token has expired');
        return;
      }

      rep
        .headers({
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        })
        .send(result);
    } else {
      Meiling.OAuth2.Error.sendOAuth2Error(
        rep,
        Meiling.OAuth2.Error.ErrorType.INTERNAL_SERVER_ERROR,
        'server misconfiguration for openid id_token issues',
      );
    }
  } catch (e) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_GRANT, 'invalid id_token');
    return;
  }
}
