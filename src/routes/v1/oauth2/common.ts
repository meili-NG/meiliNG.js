import { Client, Utils } from '../../../common';
import { OAuth2ErrorResponseType, OAuth2QueryBodyParameters } from './interfaces';

export async function validateCommonBody(
  body: OAuth2QueryBodyParameters,
  include_secret = true,
): Promise<OAuth2ErrorResponseType | true> {
  // validate query
  if (!Utils.isValidValue(body, body?.client_id, body?.grant_type)) {
    return OAuth2ErrorResponseType.INVALID_REQUEST;
  }

  if (include_secret && !Utils.isValidValue(body?.client_secret)) {
    return OAuth2ErrorResponseType.INVALID_REQUEST;
  }

  // cget client
  const clientId = body.client_id;
  const client = await Client.getByClientId(clientId);

  if (client === null) {
    return OAuth2ErrorResponseType.INVALID_CLIENT;
  }

  if (!Client.verifySecret(clientId, body.client_secret)) {
    return OAuth2ErrorResponseType.INVALID_CLIENT;
  }

  return true;
}
