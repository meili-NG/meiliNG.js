import { OAuthClient, Permission, User as UserModel } from '@prisma/client';
import { MeilingCommonOAuth2, User, Utils } from '.';
import { config, prisma } from '..';

export async function getByClientId(clientId: string) {
  const client = await prisma.oAuthClient.findFirst({
    where: {
      id: clientId,
    },
  });

  return client;
}

export async function getRedirectUris(clientId: string) {
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

export async function verifySecret(clientId: string, clientSecret: string) {
  const secrets = await prisma.oAuthClientSecrets.findMany({
    where: {
      oAuthClientId: clientId,
    },
  });

  return secrets.filter((n) => n.secret === clientSecret).length > 0;
}

export async function isValidRedirectURI(clientId: string, redirectUri: string) {
  const redirectUris = await getRedirectUris(clientId);
  return MeilingCommonOAuth2.getMatchingRedirectURIs(redirectUri, redirectUris).length > 0;
}

export async function getAccessControl(clientId: string) {
  const client = await getByClientId(clientId);
  if (!client) return;

  const acl = await prisma.oAuthClientAccessControls.findFirst({
    where: {
      id: client.oAuthClientAccessControlsId,
    },
  });

  return acl;
}

export function sanitize(client: OAuthClient) {
  return {
    id: client.id,
    image: client.image,
    name: client.name,
    privacy: client.privacy,
    terms: client.terms,
  };
}

export async function hasUserPermissions(user: UserModel | string, clientId: string, permissions: Permission[]) {
  const authorizedPermissions = await User.getClientAuthorizedPermissions(user, clientId);

  if (authorizedPermissions) {
    const unauthorizedPermissions = permissions.filter(
      (permission) =>
        authorizedPermissions.find((authPermission: Permission) => permission.name === authPermission.name) === null,
    );

    return unauthorizedPermissions.length === 0;
  } else {
    return false;
  }
}

export function shouldSkipAuthentication(clientId: string) {
  return config.oauth2.skipAuthentication.includes(clientId);
}

export async function createAuthorization(clientId: string, user: string | UserModel, permissions: Permission[]) {
  const userId = User.getUserId(user);
  const permissionsConnect: {
    name: string;
  }[] = Utils.getUnique(
    permissions.map((p) => {
      return { name: p.name };
    }),
    (p, q) => p.name === q.name,
  );

  const authorization = await prisma.oAuthClientAuthorization.create({
    data: {
      user: {
        connect: {
          id: userId,
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

  return authorization;
}
