import { OAuthClient, OAuthClientAuthorization, Permission, User as UserModel } from '@prisma/client';
import { ClientAuthorization, User } from '.';
import { prisma } from '..';
import { OAuth2QueryResponseType } from '../routes/v1/oauth2/interfaces';
import { generateToken } from './token';
import { getClientAuthorizations } from './user';

export async function getResponseToken(
  clientId: string,
  type: OAuth2QueryResponseType,
  userTmp: string | UserModel,
  tmpPermissions?: Permission[],
  overwritePermissions?: boolean,
) {
  const user = await User.getDetailedInfo(userTmp);
  if (!user) {
    return;
  }

  const authorizations = await User.getClientAuthorizations(userTmp, clientId);
  const userPermissions: Permission[] = [];

  if (authorizations) {
    for (const authorization of authorizations) {
      const tempPermissions = (await ClientAuthorization.getAuthorizedPermissions(authorization)).filter(
        (n) => userPermissions.find((o) => n.name === o.name) === null,
      );
      userPermissions.push(...tempPermissions);
    }
  }

  const permissions: Permission[] = [];

  if (userPermissions.length > 0 && tmpPermissions) {
    if (overwritePermissions) {
      permissions.push(...tmpPermissions);
    } else {
      permissions.push(...userPermissions);
      permissions.push(...tmpPermissions.filter((n) => permissions.find((o) => o.name === n.name) !== undefined));
    }
  } else if (tmpPermissions) {
    permissions.push(...tmpPermissions);
  } else {
    return;
  }

  const permissionsConnect: {
    name: string;
  }[] = permissions.map((p) => {
    return { name: p.name };
  });

  let authorization: OAuthClientAuthorization;
  const userAuthentications = await getClientAuthorizations(user, clientId);

  if (userAuthentications) {
    const userAuthentication = userAuthentications.find((n) => n.oAuthClientId === clientId);
    if (!userAuthentication) return;

    await prisma.oAuthClientAuthorization.update({
      where: {
        id: userAuthentication.id,
      },
      data: {
        permissions: {
          connect: permissionsConnect,
        },
      },
    });

    authorization = userAuthentication;
  } else {
    authorization = await prisma.oAuthClientAuthorization.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        client: {
          connect: {
            id: clientId,
          },
        },
        permissions: {
          connect: permissionsConnect,
        },
      },
    });
  }

  if (type === 'code') {
    const code = generateToken();
    await prisma.oAuthToken.create({
      data: {
        type: 'AUTHORIZATION_CODE',
        authorization: {
          connect: {
            id: authorization.id,
          },
        },
        token: code,
      },
    });
    return code;
  } else {
    return;
  }
}

export function sanitizeClient(client: OAuthClient) {
  return {
    id: client.id,
    image: client.image,
    name: client.name,
    privacy: client.privacy,
    terms: client.terms,
  };
}
