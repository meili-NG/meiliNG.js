import { OAuthTokenType } from '@prisma/client';

export interface Config {
  version: string;
  allowLogin: string[];
  invalidate: {
    [token in OAuthTokenType]: number;
  };
  sessionCookieKeyPath: string;
  errorFormatURL: string;
}
