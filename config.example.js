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
    /** Set this to undefined if you don't have any proxies */
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
    /** The hostname of the meiling, give the public URL origin of this API. */
    hostname: 'https://meiling.stella-api.dev',
    /** The following URL will be filled with errorcode on error, and sent to user */
    error: {
      urlFormat: 'https://opensource.stella-it.com/developers/docs/meiling/error/{{errorCode}}.html',
    },
    /** Specify the applications to skip the authentication steps. This should be strictly used in INTERNAL Apps with CLIENT_SECRET. */
    oauth2: {
      /** List the client_id of applications to skip the authentication steps */
      skipAuthentication: [],
    },
  },
  session: {
    /** Configures Version 1 of the Meiling Session */
    v1: {
      /** Maximum Age of Session (in seconds) */
      maxAge: 604800,
      /** Rate Limit */
      rateLimit: {
        /** How many tokens will meiling allow generating on per IP */
        maxTokenPerIP: 20,
        /** Preceding rate limit will applied to following time window */
        timeframe: 600,
      },
      /** DEBUG ONLY: ALLOW USAGE OF /v1/meiling/session?token={{token}} for viewing session data in Development mode */
      debugTokens: [],
    },
  },
  token: {
    /** Configure token generators */
    generators: {
      /** Default generator config */
      default: {
        /** which characters are you going to allow in the token */
        chars: 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890',
        /** length of the token */
        length: 128,
      },
    },
    /** Token Invalidation Config */
    invalidate: {
      /** Configures Invalidation timeframe of oauth tokens */
      oauth: {
        AUTHORIZATION_CODE: 300,
        ACCESS_TOKEN: 7200,
        REFRESH_TOKEN: 604800,
        ACCOUNT_TOKEN: -1,
      },
      /** Configures Invalidation timeframe of openid id_token */
      openid: 300,
      /** Configures Invalidation timeframe of meiling's token */
      meiling: {
        CHALLENGE_TOKEN: 300,
      },
    },
  },
};
