import { InputJsonObject, OAuthTokenType } from '@prisma/client';
import { ClientAuthorization, Token, Utils } from '.';
import { config, prisma } from '..';

export type TokenMetadata = null | TokenMetadataV1;

export interface TokenMetadataV1 {
  version: 1;
  shouldGenerate?: {
    refreshToken: boolean;
  };
}

const getDefaultAvailableCharacters = () => config.token.generators.default.chars;
const getDefaultTokenLength = () => config.token.generators.default.length;

export function generateToken(length?: number, chars?: string) {
  if (length === undefined) length = getDefaultTokenLength();
  if (chars === undefined) chars = getDefaultAvailableCharacters();

  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Utils.getCryptoSafeInteger(chars.length));
  }

  return token;
}

export async function getAuthorization(token: string, type?: OAuthTokenType) {
  const data = await getData(token, type);

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

export async function getUser(token: string, type?: OAuthTokenType) {
  const authorization = await getAuthorization(token, type);
  if (!authorization) return;

  const user = await ClientAuthorization.getUser(authorization);
  return user;
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
    await ClientAuthorization.updateLastUpdated(tokenData.oAuthClientAuthorizationId);
  }

  return tokenData ? tokenData : undefined;
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
