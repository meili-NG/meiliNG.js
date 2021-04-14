import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType } from '../interfaces';
import { oAuth2AccessTokenInfoHandler } from './access_token';
import { oAuth2IDTokenInfoHandler } from './id_token';
import { oAuth2RefreshTokenInfoHandler } from './refresh_token';

interface OAuth2QueryTokenInfoBody {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
}

export async function oAuth2TokenInfoHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const body = (req.body ? req.body : req.query) as OAuth2QueryTokenInfoBody;

  if (body?.id_token) {
    await oAuth2IDTokenInfoHandler(body.id_token, rep);
  } else if (body?.access_token) {
    await oAuth2AccessTokenInfoHandler(body.access_token, rep);
  } else if (body?.refresh_token) {
    await oAuth2RefreshTokenInfoHandler(body.refresh_token, rep);
  } else {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'missing proper query');
  }
  return;
}
