import { OAuthTokenType } from '@prisma/client';

interface TokenGeneratorConfig {
  chars: string;
  length: number;
}

export interface Config {
  version: string;
  allowLogin: string[];
  invalidate: {
    oauth: {
      [token in OAuthTokenType]: number;
    };
    meiling: {
      challenge: number;
    };
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
  verification: {
    host: string;
    key: string;
  };
  errorFormatURL: string;
  token: {
    default: TokenGeneratorConfig;
  };
  behindProxy: boolean;
  listeningPort: number;
  oauth2: {
    skipAuthentication: string[];
  };
}
