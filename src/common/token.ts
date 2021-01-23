import { InputJsonObject, OAuthTokenType } from '@prisma/client';
import crypto from 'crypto';
import { ClientAuthorization, Token, Utils } from '.';
import { config, prisma } from '..';

export type TokenMetadata = TokenMetadataBlank | TokenMetadataV1;
type TokenMetadataBlank = InputJsonObject;
interface TokenMetadataV1 extends InputJsonObject {
  version: 1;
  shouldGenerate: {
    refreshToken: boolean;
  };
}

const getDefaultAvailableCharacters = () => config.token.default.chars;
const getDefaultTokenLength = () => config.token.default.length;

export function getCryptographicallySafeRandomInteger(bound?: number): number {
  if (bound === undefined) bound = Number.MAX_SAFE_INTEGER;

  const array = new Uint32Array(1);
  crypto.randomFillSync(array);

  return array[0] % bound;
}

export function generateToken(length?: number, chars?: string) {
  if (length === undefined) length = getDefaultTokenLength();
  if (chars === undefined) chars = getDefaultAvailableCharacters();

  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(getCryptographicallySafeRandomInteger(chars.length));
  }

  return token;
}

export async function getData(token: string, type?: OAuthTokenType) {
  const tokenData = await prisma.oAuthToken.findFirst({
    where: {
      token,
      type,
    },
  });

  if (tokenData) {
    await ClientAuthorization.updateLastUpdated(tokenData.oAuthClientAuthorizationId);
  }

  return tokenData ? tokenData : undefined;
}

export async function isValidToken(token: string, type?: OAuthTokenType) {
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
      metadata,
    },
  });
}
export function getValidTimeByType(type: OAuthTokenType) {
  return config.invalidate.oauth[type];
}

export function getExpiresInByType(type: OAuthTokenType, issuedAt: Date) {
  const invalidTimer = getValidTimeByType(type);
  const expiresAt = new Date(issuedAt.getTime() + 1000 * invalidTimer);

  return (expiresAt.getTime() - new Date().getTime()) / 1000;
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
