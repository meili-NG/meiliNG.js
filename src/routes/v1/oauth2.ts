import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../..';
import { OAuth2QueryAuthParameters, OAuth2QueryTokenBaseParameters } from './interface';

export function registerV1OAuth2Endpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI + '/auth', oAuth2AuthHandler);
  app.get(baseURI + '/token', oAuth2TokenHandler);
}

function oAuth2AuthHandler(req: FastifyRequest, rep: FastifyReply) {
  const query = req.query as OAuth2QueryAuthParameters;

  /* 
    // Verification Mechanism
    
    const clientId = query?.client_id;
    const redirectUri = query?.redirect_uri;
    const responseType = query?.response_type;
    const scope = query?.scope;

    if (!(clientId && redirectUri && responseType && scope)) {
      rep.code(400).send('');
      return;
    } 
  */

  // ===

  let queryCount = 0;
  let str = '';

  for (const id in query) {
    const name = id as keyof OAuth2QueryAuthParameters;
    const value = (query as any)[id];

    str += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    queryCount++;
  }

  str = queryCount > 0 ? '?' + str.replace(/\&$/g, '') : '';

  const bestLogin = config.allowLogin[0];
  rep.redirect(302, bestLogin + '/auth' + str);
}

function oAuth2TokenHandler(req: FastifyRequest, rep: FastifyReply) {
  const query = req.query as OAuth2QueryTokenBaseParameters;
}
