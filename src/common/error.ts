import { config } from '..';

export function buildErrorCodeURL(code?: string) {
  if (code !== undefined) {
    const tmpErrorURL = config.errorFormatURL;
    return tmpErrorURL.replace(/\{\{errorCode\}\}/g, code);
  } else {
    return undefined;
  }
}
