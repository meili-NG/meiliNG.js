import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { OAuth2QueryAuthParameters } from './interfaces';
import config from '../../../resources/config';

export function oAuth2AuthHandler(req: FastifyRequest, rep: FastifyReply): void {
  const query = req.query as OAuth2QueryAuthParameters;

  let queryCount = 0;
  let str = '';

  for (const id in query) {
    const name = id as keyof OAuth2QueryAuthParameters;
    const value = (query as any)[id];

    str += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    queryCount++;
  }

  str = queryCount > 0 ? '?' + str.replace(/\&$/g, '') : '';

  const bestLogin = config.frontend.url[0];

  rep.redirect(302, bestLogin + '/auth' + str);
}
