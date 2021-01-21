export * from './token';
export * from './error';

export function isNotUndefinedOrNullOrBlank(...values: any[]): boolean {
  let isValid = true;
  for (const value of values) {
    isValid = isValid && !(value === undefined || value === null || value === '');
  }

  return isValid;
}

export function getBooleanFromString(string: string): boolean {
  return string.toLowerCase() === 'true';
}

export function getUnique(array: any[], filter: (m: any, n: any) => boolean) {
  const uniqueArray: any[] = [];

  for (const value of array) {
    if (uniqueArray.filter((n) => filter(n, value)).length === 0) {
      uniqueArray.push(value);
    }
  }

  return uniqueArray;
}
