import { OAuthClient, Permission, User as UserModel } from '@prisma/client';
import { ClientAuthorization, MeilingCommonOAuth2, User, Utils } from '.';
import { prisma } from '..';
import config from '../config';

export async function getByClientId(clientId: string) {
  const client = await prisma.oAuthClient.findFirst({
    where: {
      id: clientId,
    },
  });

  return client;
}

export async function getClientOwners(clientId: string) {
  const owners = await prisma.user.findMany({
    where: {
      ownedClients: {
        some: {
          id: clientId,
        },
      },
    },
  });

  return owners;
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

export async function verifySecret(clientId: string, clientSecret?: string) {
  const client = await getByClientId(clientId);
  if (!client) {
    return false;
  }

  const secrets = await prisma.oAuthClientSecrets.findMany({
    where: {
      oAuthClientId: clientId,
    },
  });

  // allow implicit flows
  if (secrets.length === 0) {
    if (!clientSecret) {
      return true;
    }
  } else {
    return secrets.filter((n) => n.secret === clientSecret).length > 0;
  }
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
  if (config.meiling.oauth2.skipAuthentication) {
    return config.meiling.oauth2.skipAuthentication.includes(clientId);
  }

  return false;
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

export async function getUnauthorizedPermissions(
  user: UserModel | string,
  clientId: string,
  permissions: (Permission | string)[],
) {
  const authorizations = await User.getClientAuthorizations(user, clientId);

  if (authorizations) {
    const authPromises = [];

    for (const authorization of authorizations) {
      authPromises.push(ClientAuthorization.getAuthorizedPermissions(authorization));
    }

    let minimumUnauthorizedPermissions: string[] | undefined = undefined;

    const data = await Promise.all(authPromises);
    for (const datum of data) {
      if (minimumUnauthorizedPermissions === undefined) {
        minimumUnauthorizedPermissions = datum.map((n) => n.name);
      }

      const unauthorizedPermissions = permissions.filter((p) => {
        const name = typeof p === 'string' ? p : p.name;
        return datum.filter((q) => q.name === name).length === 0;
      });

      if (minimumUnauthorizedPermissions.length > unauthorizedPermissions.length) {
        minimumUnauthorizedPermissions = unauthorizedPermissions.map((n) => (typeof n === 'string' ? n : n.name));
      }
    }

    if (minimumUnauthorizedPermissions === undefined) {
      minimumUnauthorizedPermissions = permissions.map((n) => (typeof n === 'string' ? n : n.name));
    }

    return minimumUnauthorizedPermissions;
  } else {
    return false;
  }
}
