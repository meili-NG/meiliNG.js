import { OAuthClient } from '@prisma/client';
import { prisma } from '..';

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
