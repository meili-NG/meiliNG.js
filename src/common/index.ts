export * as Client from './client';
export * as ClientAccessControls from './clientAccessControls';
export * as ClientAuthorization from './clientAuthorization';
export * as MeilingCommonError from './error';
export * as MeilingCommonOAuth2 from './oauth2';
export * as Token from './token';
export * as User from './user';
export * as Validate from './validate';

export function isNotUndefinedOrNullOrBlank(...values: unknown[]): boolean {
  let isValid = true;
  for (const value of values) {
    isValid = isValid && !(value === undefined || value === null || value === '');
  }

  return isValid;
}

export function getBooleanFromString(string: string): boolean {
  return string.toLowerCase() === 'true';
}

export function getUnique<T>(array: T[], filter: (m: T, n: T) => boolean) {
  const uniqueArray: T[] = [];

  for (const value of array) {
    if (uniqueArray.filter((n) => filter(n, value)).length === 0) {
      uniqueArray.push(value);
    }
  }

  return uniqueArray;
}
