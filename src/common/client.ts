import { OAuthClient, OAuthClientAuthorization, Permission, User } from '@prisma/client';
import { prisma } from '..';
import { OAuth2QueryGrantType, OAuth2QueryResponseType } from '../routes/v1/oauth2/interfaces';
import { generateToken } from './token';
import { getAllUserInfo, getUserInfo } from './user';

export async function getOAuth2ClientByClientId(clientId: string) {
  const client = await prisma.oAuthClient.findFirst({
    where: {
      id: clientId,
    },
  });

  return client;
}

export async function getOAuth2AuthorizationInfo(n: OAuthClientAuthorization) {
  const client = await prisma.oAuthClient.findFirst({
    where: {
      id: n.oAuthClientId,
    },
  });

  return {
    client,
    ...n,
  };
}

export async function isClientAccessible(clientId: string, user: User | string): Promise<boolean> {
  const userObject = await getUserInfo(user);
  if (!userObject) return false;

  const client = await getOAuth2ClientByClientId(clientId);
  if (!client) return false;

  if (client.type === 'PUBLIC') {
    return true;
  } else {
    if (!client.oAuthClientAccessControlsId) {
      return false;
    } else {
      const [users, groups] = await Promise.all([
        prisma.user.findMany({
          where: {
            oAuthClientAccessControlsId: client.oAuthClientAccessControlsId,
          },
        }),
        prisma.group.findMany({
          where: {
            oAuthClientAccessControlsId: client.oAuthClientAccessControlsId,
          },
        }),
      ]);

      const user = users.find((n) => n.id === userObject.id);
      if (user) return true;

      const group = groups.find((n) => userObject.groups.find((m) => m.id === n.id));
      if (group) return true;
    }
  }

  return false;
}

export async function getClientRedirectUris(clientId: string) {
  const redirectUris = [];
  const data = await prisma.oAuthClientRedirectUris.findMany({
    where: {
      oAuthClientId: clientId,
    },
  });

  for (const datum of data) {
    redirectUris.push(datum.redirectUri);
  }

  return redirectUris;
}

export async function getUserAuthorizedPermissions(
  clientId: string,
  userTmp: string | User,
): Promise<Permission[] | undefined> {
  const user = await getAllUserInfo(userTmp);

  if (user?.authorizedApps) {
    const clientAuth = user.authorizedApps.find((n) => n.oAuthClientId === clientId);
    if (!clientAuth) {
      return undefined;
    }

    const permissions = await prisma.permission.findMany({
      where: {
        OAuthClientAuthorization: clientAuth,
      },
    });

    return permissions;
  } else {
    return undefined;
  }
}

export async function authenticateClientAndGetResponseToken(
  clientId: string,
  type: OAuth2QueryResponseType,
  userTmp: string | User,
  tmpPermissions?: Permission[],
  overwritePermissions?: boolean,
) {
  const user = await getAllUserInfo(userTmp);
  if (!user) {
    return;
  }

  const userPermissions = await getUserAuthorizedPermissions(clientId, userTmp);

  const permissions: Permission[] | undefined = [];

  if (userPermissions && tmpPermissions) {
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
  if (userPermissions) {
    const userAuthorization = user.authorizedApps.find((n) => n.oAuthClientId === clientId);
    if (!userAuthorization) return;

    authorization = await prisma.oAuthClientAuthorization.update({
      where: {
        id: userAuthorization.id,
      },
      data: {
        permissions: {
          connect: permissionsConnect,
        },
      },
    });
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
