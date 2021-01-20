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
