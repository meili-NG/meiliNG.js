import { OAuthClientAuthorization, OAuthTokenType } from '@prisma/client';
import { Token } from '.';
import { prisma } from '..';

export async function getClient(authorization: OAuthClientAuthorization) {
  const client = await prisma.oAuthClient.findFirst({
    where: {
      id: authorization.oAuthClientId,
    },
  });

  return {
    client,
    ...authorization,
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
