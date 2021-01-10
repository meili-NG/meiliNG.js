import { OAuthTokenType } from '@prisma/client';

interface TokenGeneratorConfig {
  chars: string;
  length: number;
}

export interface Config {
  version: string;
  allowLogin: string[];
  invalidate: {
    [token in OAuthTokenType]: number;
  };
  sessionCookieKeyPath: string;
  errorFormatURL: string;
  token: {
    default: TokenGeneratorConfig;
  };
}
