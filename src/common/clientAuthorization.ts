import { OAuthClientAuthorization } from '@prisma/client';
import { prisma } from '..';

export async function getClient(n: OAuthClientAuthorization) {
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

export async function getAuthorizedPermissions(clientAuth: OAuthClientAuthorization) {
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
}
