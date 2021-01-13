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
    v1: {
      dataPath: string;
      maxAge: number;
      rateLimit: {
        maxTokenPerIP: number;
        timeframe: number;
      };
      debugTokens: string[];
    };
  };
  errorFormatURL: string;
  token: {
    default: TokenGeneratorConfig;
  };
}
