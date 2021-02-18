import { ConfigInterface } from './interface';

export default {
  frontend: {
    url: ['https://login.appie.stella-it.com', 'https://meiling-dev.stella-it.com', 'http://localhost:3000'],
  },
  openid: {
    issuingAuthority: 'https://meiling.stella-api.dev',
    secretKey: process.env['OPENID_JWT_SECRET'] as string,
  },
  fastify: {
    listen: '/tmp/stella-it/sockets/meiling.sock',
    proxy: {},
    unixSocket: {
      chmod: '0777',
    },
  },
  meiling: {
    hostname: 'https://meiling.stella-api.dev',
    error: {
      urlFormat: 'https://opensource.stella-it.com/developers/docs/meiling/error/{{errorCode}}.html',
    },
    oauth2: {
      skipAuthentication: [],
    },
  },
  session: {
    v1: {
      maxAge: 604800,
      rateLimit: {
        maxTokenPerIP: 20,
        timeframe: 600,
      },
      debugTokens: [],
    },
  },
  token: {
    generators: {
      default: {
        chars: 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890',
        length: 128,
      },
    },
    invalidate: {
      oauth: {
        AUTHORIZATION_CODE: 300,
        ACCESS_TOKEN: 7200,
        REFRESH_TOKEN: 604800,
        ACCOUNT_TOKEN: -1,
      },
      openid: 300,
      meiling: {
        CHALLENGE_TOKEN: 300,
      },
    },
  },
  listen: 8080,
} as ConfigInterface;
