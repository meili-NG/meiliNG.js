import crypto from 'crypto';

type AvailableLicense = 'HRPL' | 'MIT';

export function detectLicense(): AvailableLicense {
  const HRPLFlag = process.env.MEILING_FORCE_HRPL;

  if (HRPLFlag && (/true/gi.test(HRPLFlag) || Number(HRPLFlag) === 1)) {
    return 'HRPL';
  }

  return 'MIT';
}

export function isValidValue(...values: unknown[]): boolean {
  let isValid = true;
  for (const value of values) {
    isValid = isValid && !(value === undefined || value === null || value === '');
    if (!isValid) return false;
  }

  return isValid;
}

export function isValidUri(...values: (string | undefined)[]): boolean {
  let isValid = true;
  const regex = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/g;

  for (const value of values) {
    regex.lastIndex = 0;
    isValid = isValid && value !== undefined && regex.test(value) === true;
    if (!isValid) return false;
  }

  return isValid;
}

export function isNotBlank(...values: (string | undefined | null)[]): boolean {
  let isValid = true;
  for (const value of values) {
    isValid = isValid && !(value === undefined || value === null || value === '' || value.trim().length === 0);
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

export function getObjectRecursiveKeys(a: any): string[] {
  if (typeof a !== 'object') return [];
  const keys: string[] = [];

  for (const i in a) {
    keys.push(i);
    keys.push(...getObjectRecursiveKeys((a as any)[i] as any).map((n) => i + '.' + n));
  }

  return keys;
}

const emailRegex =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g;

export function convertJsonIfNot<T>(json: string | T | unknown): T {
  if (typeof json === 'string') {
    return JSON.parse(json);
  }
  return json as T;
}

export interface MeilingV1SignupName {
  name: string;
  familyName: string;
  givenName: string;
  middleName?: string;
}

export function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9-_\.]+$/g.test(username);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidEmail(email: string): boolean {
  emailRegex.lastIndex = 0;
  return emailRegex.test(email);
}

export function isValidName(name?: MeilingV1SignupName): boolean {
  if (!name) return false;

  return isNotBlank(name.name, name.familyName, name.givenName);
}

export function getCryptoSafeInteger(bound?: number): number {
  if (bound === undefined) bound = Number.MAX_SAFE_INTEGER;

  const array = new Uint32Array(1);
  crypto.randomFillSync(array);

  return array[0] % bound;
}

export function checkBase64(string: string) {
  let convertedString = string;
  if (string.includes('-') || string.includes('_')) {
    convertedString = convertedString.replace(/\-/g, '+').replace(/\_/g, '/');
    convertedString = convertedString.padEnd(Math.ceil(convertedString.length / 4) * 4, '=');
    console.log(convertedString);
  }

  const regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
  return regex.test(convertedString);
}
