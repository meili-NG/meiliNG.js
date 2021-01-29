import { OAuthTokenType } from '@prisma/client';

interface TokenGeneratorConfig {
  chars: string;
  length: number;
}

export interface Config {
  version: string;
  frontend: {
    url: string[];
  };
  meiling: {
    error: {
      urlFormat: string;
    };
    oauth2: {
      skipAuthentication?: string[];
    };
    proxy?: {
      allowedHosts: string[];
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
  token: {
    generators: {
      default: TokenGeneratorConfig;
    };
    invalidate: {
      oauth: {
        [token in OAuthTokenType]: number;
      };
      meiling: {
        challenge: number;
      };
    };
  };
  listeningPort: number;
}
