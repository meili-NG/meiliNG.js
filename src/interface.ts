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
  session: {
    sessionKeyPath: string;
    tokenDataPath: string;
    maxAge: number;
  };
  errorFormatURL: string;
  token: {
    default: TokenGeneratorConfig;
  };
}
