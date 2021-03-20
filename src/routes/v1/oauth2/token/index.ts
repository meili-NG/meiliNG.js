import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { validateCommonBody } from '../common';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType, OAuth2QueryBodyParameters, OAuth2QueryGrantType } from '../interfaces';
import { oAuth2AuthorizationCodeHandler } from './authorization_code';
import { oAuth2DeviceCodeHandler } from './device_code';
import { oAuth2RefreshTokenHandler } from './refresh_token';

// TODO: https://developers.google.com/identity/protocols/oauth2/limited-input-device#step-4:-poll-googles-authorization-server
// TODO: https://developers.google.com/identity/protocols/oauth2/native-app#exchange-authorization-code

export async function oAuth2TokenHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const body = req.body as OAuth2QueryBodyParameters;
  const validationResult = await validateCommonBody(body, false);

  if (validationResult !== true) {
    sendOAuth2Error(rep, validationResult);
    return;
  }

  if (body.grant_type === OAuth2QueryGrantType.AUTHORIZATION_CODE) {
    await oAuth2AuthorizationCodeHandler(body, rep);
  } else if (body.grant_type === OAuth2QueryGrantType.REFRESH_TOKEN) {
    await oAuth2RefreshTokenHandler(body, rep);
  } else if (body.grant_type === OAuth2QueryGrantType.DEVICE_CODE) {
    await oAuth2DeviceCodeHandler(body, rep);
  } else {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.UNSUPPORTED_GRANT_TYPE);
  }
  return;
}
