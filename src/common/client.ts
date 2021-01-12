import { OAuthClientAuthorization } from '@prisma/client';
import { prisma } from '..';

export async function getAppInfoByClientId(clientId: string) {
  const client = await prisma.oAuthClient.findFirst({
    where: {
      id: clientId,
    },
  });

  return client;
}

export async function getOAuthAuthorizationInfo(n: OAuthClientAuthorization) {
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
