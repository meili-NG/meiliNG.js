import { FastifyRequest } from 'fastify';
import { Client, Token, Utils } from '../../../common';
import { OAuth2ErrorResponseType, OAuth2QueryBodyParameters } from './interfaces';

export async function validateCommonRequest(
  req: FastifyRequest,
  include_secret = true,
): Promise<OAuth2ErrorResponseType | true> {
  const result = parseClientInfo(req);

  if (!result) {
    return OAuth2ErrorResponseType.INVALID_CLIENT;
  }

  const { clientId, clientSecret } = result;
  if (include_secret && clientSecret === undefined) {
    return OAuth2ErrorResponseType.INVALID_GRANT;
  }

  const client = await Client.getByClientId(clientId);

  if (client === null) {
    return OAuth2ErrorResponseType.INVALID_CLIENT;
  }

  if (!Client.verifySecret(clientId, clientSecret)) {
    return OAuth2ErrorResponseType.INVALID_CLIENT;
  }

  return true;
}

export function parseClientInfo(req: FastifyRequest):
  | {
      clientId: string;
      clientSecret?: string;
    }
  | undefined {
  const token = Token.getTokenFromRequest(req);

  let clientId: string | undefined = undefined;
  let clientSecret: string | undefined = undefined;

  if (token && token.method === 'Basic') {
    const firstSeperator = token.token.indexOf(':');

    clientId = token.token.slice(0, firstSeperator);
    clientSecret = token.token.slice(firstSeperator + 1);
  } else {
    const body = req.body as OAuth2QueryBodyParameters;

    // validate query
    if (!Utils.isValidValue(body, body?.client_id, body?.grant_type)) {
      return undefined;
    }

    clientId = body.client_id;
    clientSecret = body.client_secret;
  }

  if (clientId) {
    return {
      clientId,
      clientSecret,
    };
  } else {
    return undefined;
  }
}
