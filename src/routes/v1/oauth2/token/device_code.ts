import { FastifyReply } from 'fastify';
import { Client, ClientAuthorization, Token, User, Utils } from '../../../../common';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType, OAuth2QueryTokenDeviceCodeParameters } from '../interfaces';

export async function oAuth2DeviceCodeHandler(body: OAuth2QueryTokenDeviceCodeParameters, rep: FastifyReply) {
  const clientId = body.client_id;

  const token = body.device_code;
  const type = 'DEVICE_CODE';

  if (!(await Client.getByClientId(clientId))) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_CLIENT, 'invalid clientId');
    return;
  }

  if (!(await Client.verifySecret(clientId, body.client_secret))) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_CLIENT, 'invalid client secret');
    return;
  }

  // check token is valid
  if (!Utils.isValidValue(token)) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'invalid token');
    return;
  }

  if (!(await Token.isValid(token, type))) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'expired token');
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

  const metadata = await Token.getMetadata(token, type);
  if (!metadata) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'unable to find matching user_code');
    return;
  }

  const isAuthorized = metadata.data?.deviceCode?.isAuthorized;
  if (!isAuthorized) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.AUTHORIZATION_PENDING, 'Precondition Required');
    return;
  }

  const user = await ClientAuthorization.getUser(authorization);
  if (!user) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'unable to find matching user');
    return;
  }

  const scope = permissions.map((p) => p.name).join(' ');
  const scopes = scope.split(' ');

  const accessToken = await ClientAuthorization.createToken(authorization, 'ACCESS_TOKEN');
  const currentRefreshToken = await ClientAuthorization.getToken(authorization, 'REFRESH_TOKEN');

  rep.send({
    access_token: accessToken.token,
    scope,
    refresh_token: currentRefreshToken.token,
    token_type: 'Bearer',
    expires_in: Token.getValidTimeByType('ACCESS_TOKEN'),
    id_token: scopes.includes('openid') ? await User.createIDToken(user, clientId, scopes) : undefined,
  });
}
