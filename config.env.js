// load dotenv if necessary.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

module.exports = {
  frontend: {
    url: process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : ['http://frontend.meili.ng'],
  },
  openid: {
    issuingAuthority: process.env.OPENID_ISSUING_AUTHORITY || 'http://demo.meili.ng',
    secretKey: process.env.OPENID_SECRET_KEY || 'YOUR OPENID SECRET',
  },
  fastify: {
    listen: isNaN(process.env.FASTIFY_LISTEN) ? process.env.FASTIFY_LISTEN : Number(process.env.FASTIFY_LISTEN) || 3000,
    address: process.env.FASTIFY_ADDRESS,
    proxy: process.env.FASTIFY_USE_PROXY
      ? {
          allowedHosts: process.env.FASTIFY_PROXY_ALLOWED_HOSTS
            ? process.env.FASTIFY_PROXY_ALLOWED_HOSTS.split(',')
            : undefined,
        }
      : undefined,
    unixSocket: {
      chmod: process.env.FASTIFY_UNIXSOCKET_CHMOD || '0777',
    },
  },
  meiling: {
    hostname: process.env.MEILING_HOSTNAME || 'https://demo.meili.ng',
    error: {
      urlFormat:
        process.env.MEILING_ERROR_URL_FORMAT ||
        'https://opensource.stella-it.com/developers/docs/meiling/error/{{errorCode}}.html',
    },
    oauth2: {
      skipAuthentication: process.env.MEILING_OAUTH2_SKIP_AUTHENTICATION
        ? process.env.MEILING_OAUTH2_SKIP_AUTHENTICATION.split(',')
        : [],
    },
    deviceCode: {
      verification_url: process.env.MEILING_DEVICE_CODE_VERIFICATION_URL || 'http://frontend.meili.ng/device',
      interval: Number(process.env.MEILING_DEVICE_CODE_INTERVAL) || 5,
    },
  },
  session: {
    v1: {
      maxAge: Number(process.env.SESSION_V1_MAX_AGE) || 604800,
      rateLimit: {
        maxTokenPerIP: Number(process.env.SESSION_V1_RATE_LIMIT_MAX_TOKEN_PER_IP) || 20,
        timeframe: Number(process.env.SESSION_V1_RATE_LIMIT_TIME_FRAME) || 600,
      },
      debugTokens: process.env.SESSION_V1_DEBUG_TOKENS ? process.env.SESSION_V1_DEBUG_TOKENS.split(',') : [],
    },
  },
  token: {
    generators: {
      default: {
        chars:
          process.env.TOKEN_GENERATORS_DEFAULT_CHARS ||
          'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890',
        length: Number(process.env.TOKEN_GENERATORS_DEFAULT_LENGTH) || 128,
      },
      // TODO:
      tokens: {},
    },
    invalidate: {
      oauth: {
        AUTHORIZATION_CODE: Number(process.env.TOKEN_INVALIDATE_OAUTH_AUTHORIZATION_CODE) || 300,
        ACCESS_TOKEN: Number(process.env.TOKEN_INVALIDATE_OAUTH_ACCESS_TOKEN) || 7200,
        REFRESH_TOKEN: Number(process.env.TOKEN_INVALIDATE_OAUTH_REFRESH_TOKEN) || 604800,
        ACCOUNT_TOKEN: Number(process.env.TOKEN_INVALIDATE_OAUTH_ACCOUNT_TOKEN) || -1,
        DEVICE_CODE: Number(process.env.TOKEN_INVALIDATE_OAUTH_DEVICE_CODE) || 300,
      },
      openid: Number(process.env.TOKEN_INVALIDATE_OPENID) || 300,
      meiling: {
        CHALLENGE_TOKEN: Number(process.env.TOKEN_INVALIDATE_MEILING_CHALLENGE_TOKEN) || 300,
        CHALLENGE_TOKEN_SMS_RATE_LIMIT:
          Number(process.env.TOKEN_INVALIDATE_MEILING_CHALLENGE_TOKEN_SMS_RATE_LIMIT) || 60,
        CHALLENGE_TOKEN_EMAIL_RATE_LIMIT:
          Number(process.env.TOKEN_INVALIDATE_MEILING_CHALLENGE_TOKEN_EMAIL_RATE_LIMIT) || 60,
      },
    },
  },
  notificationApi: {
    version: Number(process.env.NOTIFICATION_API_VERSION) || 1,
    host: process.env.NOTIFICATION_API_HOST || 'https://notification.meili.ng',
    key: process.env.NOTIFICATION_API_KEY || 'YOUR NOTIFICATION API KEY',
  },
};
