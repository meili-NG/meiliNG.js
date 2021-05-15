import { Permission } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Client, ClientAccessControls, Token, Utils } from '../../../../common';
import { generateToken } from '../../../../common/token';
import config from '../../../../resources/config';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType } from '../interfaces';
import { getPrismaClient } from '../../../../resources/prisma';

interface DeviceCodeRequestBody {
  client_id: string;
  scope: string;
}

export async function meilingV1OAuth2DeviceCodeHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const body = req.body as DeviceCodeRequestBody;
  const type = 'DEVICE_CODE';

  if (!Utils.isValidValue(body, body.client_id, body.scope)) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST);
    return;
  }

  const client = await Client.getByClientId(body.client_id);
  if (!client) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST, 'no client found');
    return;
  }

  const device_code = generateToken();
  const user_code = generateToken(8, '0123456789QWERTYUIOPASDFGHJKLZXCVBNM');
  const metadata: Token.TokenMetadata = {
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
  const acl = await Client.getAccessControl(client.id);
  if (!acl) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INTERNAL_SERVER_ERROR, 'Failed to get Access Control from Server.');
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
    sendOAuth2Error(
      rep,
      OAuth2ErrorResponseType.INVALID_REQUEST,
      `the scope: (${unsupportedScopes.join(' ')}) is not supported`,
    );
    return;
  }

  const areScopesAllowed = await ClientAccessControls.checkPermissions(acl, requestedPermissions);
  if (areScopesAllowed !== true) {
    if (areScopesAllowed === false) {
      sendOAuth2Error(rep, OAuth2ErrorResponseType.INTERNAL_SERVER_ERROR, 'Failed to get Access Control from Server.');
      return;
    } else {
      const deniedScopes = areScopesAllowed.map((n) => n.name);
      sendOAuth2Error(
        rep,
        OAuth2ErrorResponseType.INVALID_GRANT,
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
    expires_in: Token.getExpiresInByType(type, new Date()),
    // TODO: Make this configurable
    interval: config.meiling.deviceCode.interval,
    user_code: user_code,
    // TODO: Make available to configure verification_url
    verification_url: config.meiling.deviceCode.verification_url,
  });
}
