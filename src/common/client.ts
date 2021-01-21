import { OAuthClient, OAuthClientAccessControls, OAuthClientAuthorization, Permission, User } from '@prisma/client';
import { group } from 'console';
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

export async function checkClientPermissions(
  clientId: string,
  permissions: Permission[],
): Promise<boolean | Permission[]> {
  const acl = await getClientAccessControls(clientId);
  if (!acl) return false;

  const allowedPermissions = await prisma.permission.findMany({
    where: {
      accessControls: {
        some: {
          id: acl.id,
        },
      },
    },
  });

  const deniedPermissions = permissions.filter((p) => allowedPermissions.find((a) => a.name === p.name) === undefined);
  if (deniedPermissions.length === 0) {
    return true;
  } else {
    return deniedPermissions;
  }
}

export async function getClientAccessControls(clientId: string) {
  const client = await getOAuth2ClientByClientId(clientId);
  if (!client) return;

  const acl = await prisma.oAuthClientAccessControls.findFirst({
    where: {
      id: client.oAuthClientAccessControlsId,
    },
  });

  return acl;
}

export async function checkClientAccessControlledUsers(
  acl: OAuthClientAccessControls,
  user: User | string,
): Promise<boolean> {
  // If no user access controls, it is free.
  if (!acl.oAuthUserAccessControlsId) return true;

  const userObject = await getUserInfo(user);
  if (!userObject) return false;

  const [users, groups] = await Promise.all([
    prisma.user.findMany({
      where: {
        oAuthUserAccessControlsId: acl.oAuthUserAccessControlsId,
      },
    }),
    prisma.group.findMany({
      where: {
        oAuthUserAccessControlsId: acl.oAuthUserAccessControlsId,
      },
    }),
  ]);

  const matchingUser = users.find((n) => n.id === userObject.id);
  if (matchingUser) return true;

  const matchingGroup = groups.find((n) => userObject.groups.find((m) => m.id === n.id));
  if (matchingGroup) return true;

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

export async function getClientAuthorizations(userTmp: string | User, clientId?: string) {
  let returnData;

  const user = await getUserInfo(userTmp);
  if (!user) return;

  const authorizations = await prisma.oAuthClientAuthorization.findMany({
    where: {
      userId: user.id,
    },
  });

  if (clientId) {
    returnData = authorizations.filter((n) => n.oAuthClientId === clientId);
  } else {
    returnData = authorizations;
  }

  return returnData.length > 0 ? returnData : undefined;
}

export async function getUserAuthorizedPermissions(
  clientId: string,
  userTmp: string | User,
): Promise<Permission[] | undefined> {
  const user = await getAllUserInfo(userTmp);
  const clientAuthorizations = await getClientAuthorizations(userTmp, clientId);

  if (clientAuthorizations) {
    const clientAuth = clientAuthorizations.find((n) => n.id === clientId);
    if (!clientAuth) {
      return undefined;
    }

    const permissions = await prisma.permission.findMany({
      where: {
        authorizations: {
          some: {
            id: clientAuth.id,
          },
        },
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
