import { OAuthTokenType } from '@prisma/client';

interface TokenGeneratorConfig {
  chars: string;
  length: number;
}

type SessionV1StorageConfig = SessionV1StorageFileConfig;

interface SessionV1StorageFileConfig {
  type: 'file';
  path: string;
}

export interface Config {
  version: string;
  openid: {
    issuingAuthority: string;
    secretKey: string;
  };
  frontend: {
    url: string[];
  };
  fastify: {
    listen: number | string;
    proxy?: {
      allowedHosts: string[];
    };
  };
  meiling: {
    hostname: string;
    error: {
      urlFormat: string;
    };
    oauth2: {
      skipAuthentication?: string[];
    };
  };
  session: {
    v1: {
      storage?: SessionV1StorageConfig;
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
      openid: number;
      meiling: {
        challenge: number;
      };
    };
  };
}
