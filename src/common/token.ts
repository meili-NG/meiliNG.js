import crypto from 'crypto';
import { config } from '..';

const availableCharacters = config.token.default.chars;
const defaultTokenLength = config.token.default.length;

export function getCryptographicallySafeRandomInteger(bound?: number): number {
  if (bound === undefined) bound = Number.MAX_SAFE_INTEGER;

  const array = new Uint32Array(1);
  crypto.randomFillSync(array);

  return array[0] % bound;
}

export function generateToken(length?: number, chars?: string) {
  if (length === undefined) length = defaultTokenLength;
  if (chars === undefined) chars = availableCharacters;

  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(getCryptographicallySafeRandomInteger(chars.length));
  }

  return token;
}
