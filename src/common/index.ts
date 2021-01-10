import crypto from 'crypto';

const availableCharacters = 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890';
const defaultTokenLength = 128;

export function getCryptographicallySafeRandomInteger(bound?: number): number {
  if (bound === undefined) bound = Number.MAX_SAFE_INTEGER;

  const array = new Uint32Array(1);
  crypto.randomFillSync(array);

  return array[0] % bound;
}

export function generateToken(chars?: string, length?: number) {
  if (chars === undefined) chars = availableCharacters;
  if (length === undefined) length = defaultTokenLength;

  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(getCryptographicallySafeRandomInteger(chars.length));
  }

  return token;
}
