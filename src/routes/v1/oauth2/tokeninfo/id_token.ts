import { FastifyReply } from 'fastify';
import JWT from 'jsonwebtoken';
import config from '../../../../resources/config';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType } from '../interfaces';

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
        sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'id_token has expired');
        return;
      }

      rep.send(result);
    } else {
      sendOAuth2Error(
        rep,
        OAuth2ErrorResponseType.INTERNAL_SERVER_ERROR,
        'server misconfiguration for openid id_token issues',
      );
    }
  } catch (e) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'invalid id_token');
    return;
  }
}
