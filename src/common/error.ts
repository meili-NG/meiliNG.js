import config from '../config';

export function buildErrorCodeURL(code?: string): string | undefined {
  if (code !== undefined) {
    const tmpErrorURL = config.meiling.error.urlFormat;
    return tmpErrorURL.replace(/\{\{errorCode\}\}/g, code);
  } else {
    return undefined;
  }
}
