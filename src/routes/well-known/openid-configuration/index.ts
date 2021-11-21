import { getPrismaClient } from '../../../resources/prisma';
import { FastifyRequest } from 'fastify';
import { FastifyReply } from 'fastify';

import config from '../../../resources/config';
import { OAuth2QueryGrantType, OAuth2QueryResponseType } from '../../v1/oauth2/interfaces';

function buildMeilingURL(path: string) {
  const url = new URL(config.meiling.hostname);

  if (url.pathname.endsWith('/') && path.startsWith('/')) {
    url.pathname += path.replace(/^\//g, '');
  }
  url.pathname = url.pathname.replace(/([^:]\/)\/+/g, '$1');

  return url.toString();
}

async function openIdConfigurationHandler(req: FastifyRequest, rep: FastifyReply) {
  // TODO: This should be updated when meiling's main version updates.
  // currently it is written for /v1/ endpoints.

  rep.send({
    issuer: config.openid.issuingAuthority,
    authorization_endpoint: buildMeilingURL('/v1/oauth2/auth'),
    device_authorization_endpoint: config.meiling.deviceCode.verification_url,
    token_endpoint: buildMeilingURL('/v1/oauth2/auth'),
    userinfo_endpoint: buildMeilingURL('/v1/oauth2/userinfo'),
    jwks_uri: buildMeilingURL('/v1/oauth2/certs'),
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    id_token_signing_alg_values_supported: [config.openid.jwt.algorithm],

    //check_session_iframe: buildMeilingURL("/v1/oauth2/user"),
    //end_session_endpoint: buildMeilingURL("/v1/oauth2/user"),
    //registration_endpoint: buildMeilingURL("/v1/oauth2/register"),
    code_challenge_methods_supported: ['plain', 'S256'],
    grant_types_supported: [
      OAuth2QueryGrantType.AUTHORIZATION_CODE,
      OAuth2QueryGrantType.REFRESH_TOKEN,
      OAuth2QueryGrantType.DEVICE_CODE,
    ],
    response_types_supported: [OAuth2QueryResponseType.CODE, OAuth2QueryResponseType.TOKEN],

    scopes_supported: (
      await getPrismaClient().permission.findMany({
        where: {
          isAvailable: true,
        },
      })
    ).map((n) => n.name),
  });
}

export default openIdConfigurationHandler;
