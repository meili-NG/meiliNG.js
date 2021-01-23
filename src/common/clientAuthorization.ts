import { OAuthClientAuthorization, OAuthTokenType } from '@prisma/client';
import { Token } from '.';
import { prisma } from '..';

export function getId(authorization: OAuthClientAuthorization | string) {
  if (typeof authorization === 'string') {
    return authorization;
  }
  return authorization.id;
}

export async function getById(authorization: OAuthClientAuthorization | string) {
  if (typeof authorization === 'string') {
    const tmpAuthorization = await prisma.oAuthClientAuthorization.findFirst({
      where: {
        id: getId(authorization),
      },
    });

    if (tmpAuthorization) authorization = tmpAuthorization;
    else return;
  }

  return authorization;
}

export async function getClient(authorization: OAuthClientAuthorization | string) {
  const client = await prisma.oAuthClient.findFirst({
    where: {
      id: getId(authorization),
    },
  });

  const tmpAuthorization = await getById(authorization);

  return {
    client,
    ...tmpAuthorization,
  };
}

export async function createToken(
  authorization: OAuthClientAuthorization,
  type: OAuthTokenType,
  metadata?: Token.TokenMetadata,
) {
  // TODO: allow custom generator for token
  const token = Token.generateToken();

  await prisma.oAuthToken.create({
    data: {
      authorization: {
        connect: {
          id: authorization.id,
        },
      },
      type,
      token,
      metadata,
    },
  });

  updateLastUpdated(authorization);

  return token;
}

export async function getAuthorizedPermissions(authorization: OAuthClientAuthorization) {
  const permissions = await prisma.permission.findMany({
    where: {
      authorizations: {
        some: {
          id: authorization.id,
        },
      },
    },
  });

  return permissions;
}

export async function updateLastUpdated(authorization: OAuthClientAuthorization | string) {
  await prisma.oAuthClientAuthorization.update({
    where: {
      id: getId(authorization),
    },
    data: {
      lastUpdatedAt: new Date(),
    },
  });
}
