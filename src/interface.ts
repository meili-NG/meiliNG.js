import { OAuthTokenType } from '@prisma/client';
import { TokenGenerator } from './common/token';

type SessionV1StorageConfig = SessionV1StorageFileConfig;

interface SessionV1StorageFileConfig {
  type: 'file';
  path: string;
}

export interface ConfigInterface {
  frontend: {
    url: string[];
  };
  openid: {
    issuingAuthority: string;
    secretKey: string;
  };
  fastify: {
    listen: number | string;
    address?: string;
    unixSocket?: {
      chown?: {
        uid?: number;
        gid?: number;
      };
      chmod?: string;
    };
    proxy?: {
      allowedHosts?: string[];
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
      default: TokenGenerator;
      tokens: {
        [token in OAuthTokenType]: TokenGenerator;
      };
    };
    invalidate: {
      oauth: {
        [token in OAuthTokenType]: number;
      };
      openid: number;
      meiling: {
        CHALLENGE_TOKEN: number;
      };
    };
  };
  notificationApi?: {
    version: 1;
    host: string;
    key: string;
  };
}
