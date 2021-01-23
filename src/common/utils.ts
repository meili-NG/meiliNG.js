import crypto from 'crypto';

export function isValidValue(...values: unknown[]): boolean {
  let isValid = true;
  for (const value of values) {
    isValid = isValid && !(value === undefined || value === null || value === '');
    if (!isValid) return false;
  }

  return isValid;
}

export function string2Boolean(string?: string): boolean | undefined {
  if (!string) return;
  if (string.toLowerCase() !== 'true' && string.toLowerCase() !== 'false') return;

  return string.toLowerCase() === 'true';
}

export function getUnique<T>(array: T[], equals: (m: T, n: T) => boolean) {
  const uniqueArray: T[] = [];

  for (const value of array) {
    if (uniqueArray.filter((n) => equals(n, value)).length === 0) {
      uniqueArray.push(value);
    }
  }

  return uniqueArray;
}

export function convertJsonIfNot<T>(json: string | T | unknown): T {
  if (typeof json === 'string') {
    return JSON.parse(json);
  }
  return json as T;
}

export function checkUsernameCondition(username: string) {
  return true;
}

export function checkPasswordCondition(password: string) {
  return true;
}

export function getCryptoSafeInteger(bound?: number): number {
  if (bound === undefined) bound = Number.MAX_SAFE_INTEGER;

  const array = new Uint32Array(1);
  crypto.randomFillSync(array);

  return array[0] % bound;
}
