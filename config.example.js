module.exports = {
  frontend: {
    /** Please enter the frontend address. Used for cors origin and login redirects. */
    url: ['https://login.appie.stella-it.com', 'https://meiling-dev.stella-it.com', 'http://localhost:3000'],
  },
  openid: {
    /** The name to be set as the JWT issuer. */
    issuingAuthority: 'https://meiling.stella-api.dev',
    /** OPENID JWT encryption key. */
    secretKey: 'YOUR OPENID SECRET',
  },
  fastify: {
    /** Specifies the port number or socket file location. */
    listen: 3000,
    /** Please enter your listening address. */
    address: '0.0.0.0',
    proxy: {
      /** Please enter the proxy address to allow. */
      allowedHosts: [],
    },
    unixSocket: {
      /** Sets the permissions of UNIX Socket. */
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
};
