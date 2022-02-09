import { Permission } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Meiling, Utils } from '../../../../common';
import config from '../../../../resources/config';
import { getPrismaClient } from '../../../../resources/prisma';
import { parseClientInfo } from '../common';

interface DeviceCodeRequestBody {
  client_id: string;
  scope: string;
}

export async function meilingV1OAuth2DeviceCodeHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const result = parseClientInfo(req);

  if (!result) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_CLIENT, 'invalid client id');
    return;
  }

  const { clientId } = result;
  const body = req.body as DeviceCodeRequestBody;
  const type = 'DEVICE_CODE';

  if (!Utils.isValidValue(body, clientId, body.scope)) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_REQUEST);
    return;
  }

  const client = await Meiling.OAuth2.Client.getByClientId(clientId);
  if (!client) {
    Meiling.OAuth2.Error.sendOAuth2Error(rep, Meiling.OAuth2.Error.ErrorType.INVALID_REQUEST, 'no client found');
    return;
  }

  const device_code = Meiling.Authentication.Token.generateToken();
  const user_code = Meiling.Authentication.Token.generateToken(8, '0123456789QWERTYUIOPASDFGHJKLZXCVBNM');
  const metadata: Meiling.Authentication.Token.TokenMetadata = {
    version: 1,
    data: {
      deviceCode: {
        userCode: user_code,
        isAuthorized: false,
        isRejected: false,
      },
    },
  };

  // check permissions are valid or not
  const scopes = Utils.getUnique(body.scope.split(' '), (m, n) => m === n);

  const permissionsPromise: Promise<Permission | null>[] = [];
  scopes.forEach((scope) =>
    permissionsPromise.push(
      getPrismaClient().permission.findFirst({
        where: {
          name: scope,
        },
      }),
    ),
  );

  // load access control
  const acl = await Meiling.OAuth2.Client.getAccessControl(client.id);
  if (!acl) {
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INTERNAL_SERVER_ERROR,
      'Failed to get Access Control from Server.',
    );
    return;
  }

  // permissions that were requested
  const requestedPermissions = (await Promise.all(permissionsPromise)) as Permission[];

  // find unsupported scope
  const unsupportedScopes = requestedPermissions
    .map((n, i) => (n === null ? scopes[i] : undefined))
    .filter((j) => j !== undefined);
  if (unsupportedScopes.length > 0) {
    // invalid permissions found!
    Meiling.OAuth2.Error.sendOAuth2Error(
      rep,
      Meiling.OAuth2.Error.ErrorType.INVALID_REQUEST,
      `the scope: (${unsupportedScopes.join(' ')}) is not supported`,
    );
    return;
  }

  const areScopesAllowed = await Meiling.OAuth2.ClientAccessControls.checkPermissions(acl, requestedPermissions);
  if (areScopesAllowed !== true) {
    if (areScopesAllowed === false) {
      Meiling.OAuth2.Error.sendOAuth2Error(
        rep,
        Meiling.OAuth2.Error.ErrorType.INTERNAL_SERVER_ERROR,
        'Failed to get Access Control from Server.',
      );
      return;
    } else {
      const deniedScopes = areScopesAllowed.map((n) => n.name);
      Meiling.OAuth2.Error.sendOAuth2Error(
        rep,
        Meiling.OAuth2.Error.ErrorType.INVALID_GRANT,
        `the scope (${deniedScopes.join(' ')}) is not authorized`,
      );
      return;
    }
  }

  await getPrismaClient().oAuthToken.create({
    data: {
      token: device_code,
      type,
      metadata: metadata as any,
      authorization: {
        create: {
          client: {
            connect: {
              id: client.id,
            },
          },
          permissions: {
            connect: requestedPermissions.map((n) => {
              return {
                name: n.name,
              };
            }),
          },
        },
      },
    },
  });

  rep.send({
    device_code,
    expires_in: Meiling.Authentication.Token.getExpiresInByType(type, new Date()),
    // TODO: Make this configurable
    interval: config.meiling.deviceCode.interval,
    user_code: user_code,
    // TODO: Make available to configure verification_url
    verification_url: config.meiling.deviceCode.verification_url,
  });
}
