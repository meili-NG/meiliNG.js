import { InputJsonObject, OAuthClient, OAuthTokenType, Permission, User as UserModel } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import { Client, ClientAuthorization, Token, User, Utils } from '.';
import { prisma } from '..';
import config from '../config';
import { OAuth2QueryCodeChallengeMethod } from '../routes/v1/oauth2/interfaces';

export type TokenMetadata = null | TokenMetadataV1;

export interface TokenMetadataV1 {
  version: 1;
  options?: {
    offline: boolean;
    code_challenge?: {
      method: OAuth2QueryCodeChallengeMethod;
      challenge: string;
    };
    openid?: {
      nonce?: string;
    };
  };
  data?: {
    deviceCode?: {
      userCode: string;
      isAuthorized: boolean;
      isRejected: boolean;
    };
  };
}

export interface TokenGenerator {
  chars?: string;
  length?: number;
}

export function generateToken(length?: number, chars?: string) {
  if (length === undefined) length = config.token.generators.default.length as number;
  if (chars === undefined) chars = config.token.generators.default.chars as string;

  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Utils.getCryptoSafeInteger(chars.length));
  }

  return token;
}

export function generateTokenViaType(type?: OAuthTokenType) {
  if (!type) return generateToken();
  const generator = config.token.generators?.tokens[type]
    ? config.token.generators?.tokens[type]
    : config.token.generators.default;

  return generateToken(generator.length, generator.chars);
}

export function generateTokenViaGenerator(generator?: TokenGenerator) {
  if (!generator) return generateToken();
  return generateToken(generator.length, generator.chars);
}

export async function getAuthorization(token: string, type?: OAuthTokenType) {
  const data = await getData(token, type);

  if (!data?.oAuthClientAuthorizationId) return undefined;

  if (data) {
    const authorization = await prisma.oAuthClientAuthorization.findUnique({
      where: {
        id: data.oAuthClientAuthorizationId,
      },
    });

    if (authorization) await ClientAuthorization.updateLastUpdated(authorization);

    return authorization;
  }

  return;
}

export async function getAuthorizedPermissions(token: string, type?: OAuthTokenType) {
  const authorization = await getAuthorization(token, type);
  if (!authorization) return;

  const permissions = await ClientAuthorization.getAuthorizedPermissions(authorization);
  return permissions;
}

export async function getData(token: string, type?: OAuthTokenType) {
  const tokenData = await prisma.oAuthToken.findUnique({
    where: {
      token,
    },
  });

  if (tokenData) {
    if (type && tokenData.type !== type) {
      return undefined;
    }

    if (tokenData.oAuthClientAuthorizationId) {
      await ClientAuthorization.updateLastUpdated(tokenData.oAuthClientAuthorizationId);
    }
  }

  return tokenData ? tokenData : undefined;
}

export async function getUser(token: string, type?: OAuthTokenType): Promise<UserModel | undefined> {
  const tokenData = await getData(token, type);
  if (!tokenData) return undefined;

  if (!tokenData.oAuthClientAuthorizationId) return undefined;

  const clientAuthorization = await ClientAuthorization.getById(tokenData.oAuthClientAuthorizationId);
  if (!clientAuthorization) return undefined;

  if (!clientAuthorization?.userId) return undefined;
  const user = await User.getBasicInfo(clientAuthorization?.userId);
  if (!user) return undefined;

  if (user) {
    await User.updateLastAuthenticated(user);
  }

  return user && user !== null ? user : undefined;
}

export async function getClient(token: string, type?: OAuthTokenType): Promise<OAuthClient | undefined> {
  const tokenData = await getData(token, type);
  if (!tokenData) return undefined;

  if (!tokenData.oAuthClientAuthorizationId) return undefined;

  const clientAuthorization = await ClientAuthorization.getById(tokenData.oAuthClientAuthorizationId);
  if (!clientAuthorization) return undefined;

  const client = await Client.getByClientId(clientAuthorization.oAuthClientId);
  if (!client) return undefined;

  return client && client !== null ? client : undefined;
}

export async function doesExist(token: string, type?: OAuthTokenType) {
  return (await getData(token, type)) !== undefined;
}

export async function getMetadata(token: string, type?: OAuthTokenType): Promise<Token.TokenMetadata | undefined> {
  const tokenData = await getData(token, type);
  if (!tokenData) return undefined;
  try {
    return Utils.convertJsonIfNot(tokenData.metadata) as Token.TokenMetadata;
  } catch (e) {
    return undefined;
  }
}

export async function setMetadata(token: string, metadata: Token.TokenMetadata) {
  await prisma.oAuthToken.update({
    where: {
      token,
    },
    data: {
      metadata: (metadata as unknown) as InputJsonObject,
    },
  });
}
export function getValidTimeByType(type: OAuthTokenType) {
  return config?.token?.invalidate?.oauth[type] === undefined
    ? Number.MAX_SAFE_INTEGER
    : config?.token?.invalidate?.oauth[type];
}

export function getExpiresInByType(type: OAuthTokenType, issuedAt: Date) {
  const invalidTimer = getValidTimeByType(type);
  const expiresAt = new Date(issuedAt.getTime() + 1000 * invalidTimer);

  const leftOver = (expiresAt.getTime() - new Date().getTime()) / 1000;
  return leftOver;
}

export async function getExpiresIn(token: string, type?: OAuthTokenType) {
  const data = await getData(token, type);
  if (!data) return -1;

  type = data.type;
  const issuedAt = data.issuedAt;

  return getExpiresInByType(type, issuedAt);
}

export function isValidByType(type: OAuthTokenType, issuedAt: Date) {
  return getExpiresInByType(type, issuedAt) > 0;
}

export async function isValid(token: string, type?: OAuthTokenType): Promise<boolean> {
  const data = await getData(token);
  if (!data) return false;

  const issuedAt = data.issuedAt;
  type = data.type;

  return isValidByType(type, issuedAt);
}

export async function serialize(
  token: string,
  type?: OAuthTokenType,
): Promise<null | {
  token: string;
  scope: string;
  token_type: 'Bearer';
  expires_in: number;
}> {
  const data = await getData(token, type);
  if (!data) return null;

  let permissions: Permission[];
  const permissionsTmp = await Token.getAuthorizedPermissions(token, type);
  if (!permissionsTmp) {
    permissions = [];
  } else {
    permissions = permissionsTmp;
  }

  const scope = permissions.map((p) => p.name).join(' ');

  return {
    token,
    scope,
    token_type: 'Bearer',
    expires_in: await Token.getExpiresIn(token, type),
  };
}

export function getTokenFromRequest(
  req: FastifyRequest,
):
  | {
      method: string;
      token: string;
    }
  | undefined {
  if (req.headers.authorization) {
    const method = req.headers.authorization.split(' ')[0];
    const token = req.headers.authorization.split(' ').splice(1).join(' ');
    return {
      method,
      token,
    };
  }
  return;
}
