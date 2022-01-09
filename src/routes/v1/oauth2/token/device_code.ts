import { FastifyReply, FastifyRequest } from 'fastify';
import { Meiling, Utils } from '../../../../common';
import { parseClientInfo } from '../common';

export async function oAuth2DeviceCodeHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const result = parseClientInfo(req);

  if (!result) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_CLIENT, 'invalid client id');
    return;
  }

  const { clientId } = result;
  const body = req.body as Meiling.OAuth2.Interfaces.TokenViaDeviceCodeParameters;

  const token = body.device_code;
  const type = 'DEVICE_CODE';

  if (!(await Meiling.OAuth2.Client.getByClientId(clientId))) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_CLIENT, 'invalid client id');
    return;
  }

  if (!(await Meiling.OAuth2.Client.verifySecret(clientId, body.client_secret))) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_CLIENT, 'invalid client secret');
    return;
  }

  // check token is valid
  if (!Utils.isValidValue(token)) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_REQUEST, 'invalid token');
    return;
  }

  if (!(await Meiling.Authorization.Token.isValid(token, type))) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_GRANT, 'expired token');
    return;
  }

  const authorization = await Meiling.Authorization.Token.getAuthorization(token, type);
  if (!authorization) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
      'unable to find proper authorization session',
    );
    return;
  }

  const permissions = await Meiling.Authorization.Token.getAuthorizedPermissions(token, type);
  if (!permissions) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_REQUEST,
      'unable to find permissions to authenticate',
    );
    return;
  }

  const metadata = await Meiling.Authorization.Token.getMetadata(token, type);
  if (!metadata) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_REQUEST,
      'unable to find matching user_code',
    );
    return;
  }

  const isAuthorized = metadata.data?.deviceCode?.isAuthorized;
  if (!isAuthorized) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.AUTHORIZATION_PENDING,
      'Precondition Required',
    );
    return;
  }

  const user = await Meiling.OAuth2.ClientAuthorization.getUser(authorization);
  if (!user) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_REQUEST,
      'unable to find matching user',
    );
    return;
  }

  const scope = permissions.map((p) => p.name).join(' ');
  const scopes = scope.split(' ');

  const accessToken = await Meiling.OAuth2.ClientAuthorization.createToken(authorization, 'ACCESS_TOKEN');
  const currentRefreshToken = await Meiling.OAuth2.ClientAuthorization.getToken(authorization, 'REFRESH_TOKEN');

  rep
    .headers({
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    })
    .send({
      access_token: accessToken.token,
      scope,
      refresh_token: currentRefreshToken.token,
      token_type: 'Bearer',
      expires_in: Meiling.Authorization.Token.getValidTimeByType('ACCESS_TOKEN'),
      id_token: scopes.includes('openid')
        ? await Meiling.Identity.User.createIDToken(user, clientId, scopes)
        : undefined,
    });
}
