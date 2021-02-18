import config from '../config';

export function buildErrorCodeURL(code?: string) {
  if (code !== undefined) {
    const tmpErrorURL = config.meiling.error.urlFormat;
    return tmpErrorURL.replace(/\{\{errorCode\}\}/g, code);
  } else {
    return undefined;
  }
}
