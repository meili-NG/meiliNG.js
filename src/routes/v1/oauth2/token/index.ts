import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { validateCommonRequest } from '../common';
import { Meiling } from '../../../../common';
import { oAuth2AuthorizationCodeHandler } from './authorization_code';
import { oAuth2DeviceCodeHandler } from './device_code';
import { oAuth2RefreshTokenHandler } from './refresh_token';

// TODO: https://developers.google.com/identity/protocols/oauth2/limited-input-device#step-4:-poll-googles-authorization-server
// TODO: https://developers.google.com/identity/protocols/oauth2/native-app#exchange-authorization-code

export async function oAuth2TokenHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const body = req.body as Meiling.OAuth2.Interfaces.QueryBodyParameters;
  const validationResult = await validateCommonRequest(req, false);

  if (validationResult !== true) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, validationResult);
    return;
  }

  if (body.grant_type === Meiling.OAuth2.Interfaces.GrantType.AUTHORIZATION_CODE) {
    await oAuth2AuthorizationCodeHandler(req, rep);
  } else if (body.grant_type === Meiling.OAuth2.Interfaces.GrantType.REFRESH_TOKEN) {
    await oAuth2RefreshTokenHandler(req, rep);
  } else if (body.grant_type === Meiling.OAuth2.Interfaces.GrantType.DEVICE_CODE) {
    await oAuth2DeviceCodeHandler(req, rep);
  } else {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.UNSUPPORTED_GRANT_TYPE);
  }
  return;
}
