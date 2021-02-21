import { FastifyReply } from 'fastify';
import { OAuth2QueryTokenDeviceCodeParameters } from '../interfaces';

export async function oAuth2DeviceCodeHandler(body: OAuth2QueryTokenDeviceCodeParameters, rep: FastifyReply) {
  const token = body.device_code;
  const type = 'DEVICE_CODE';

  /*
  // check token is valid
  if (!Utils.isValidValue(token)) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'invalid token');
    return;
  }

  if (!(await Token.isValid(token, type))) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'expired token');
    return;
  }

  // get user
  const user = await Token.getUser(token, type);
  if (!user) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'unable to find user to authenticate');
    return;
  }

  const authorization = await Token.getAuthorization(token, type);
  if (!authorization) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'unable to find proper authorization session');
    return;
  }

  const permissions = await Token.getAuthorizedPermissions(token, type);
  if (!permissions) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'unable to find permissions to authenticate');
    return;
  }

  const scope = permissions.map((p) => p.name).join(' ');

  const accessToken = await ClientAuthorization.createToken(authorization, 'ACCESS_TOKEN');

  const currentRefreshToken = await ClientAuthorization.getToken(authorization, 'REFRESH_TOKEN');
  const shouldSendRefreshToken = token === currentRefreshToken.token;

  rep.send({
    access_token: accessToken.token,
    scope,
    refresh_token: shouldSendRefreshToken ? currentRefreshToken.token : undefined,
    token_type: 'Bearer',
    expires_in: Token.getValidTimeByType('ACCESS_TOKEN'),
  });
*/
}
