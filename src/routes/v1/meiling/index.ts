import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import fastifyCors from 'fastify-cors';
import { NodeEnvironment } from '../../../interface';
import config from '../../../resources/config';
import { appsPlugin } from './apps';
import { meilingV1SessionAuthnPlugin } from './authentication';
import { Meiling } from '../../../common';
import { lostPasswordHandler } from './lost-password';
import { sessionPlugin } from './session';
import { signinHandler } from './signin';
import { signoutPlugin } from './signout';
import { signupPlugin } from './signup/';
import { userPlugin } from './users';

export interface FastifyRequestWithSession extends FastifyRequest {
  session: Meiling.V1.Interfaces.MeilingSession;
}

function meilingV1Plugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.addSchema({
    $id: 'MeilingV1Error',
    description: 'Common error response of meiliNG',
    type: 'object',
    required: ['type'],
    properties: {
      type: { type: 'string', enum: Object.values(Meiling.V1.Error.ErrorType) },
      description: { type: 'string' },
      details: { type: 'string' },
      debug: { type: 'object', nullable: true },
      stack: { type: 'string', nullable: true },
    },
  });

  app.setErrorHandler(async (_err, req, rep) => {
    const err = _err as Error;
    if ((err as Meiling.V1.Error.MeilingError)._isMeiling === true) {
      const mlError = err as Meiling.V1.Error.MeilingError;

      return mlError.sendFastify(rep);
    } else {
      // This is internal server error.
      if (_err.validation) {
        // if it is validation issue, the error type is INVALID_REQUEST
        const error = new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST);
        error.loadError(_err);

        return error.sendFastify(rep);
      } else {
        const error = new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INTERNAL_SERVER_ERROR);
        error.loadError(_err);

        return error.sendFastify(rep);
      }
    }
  });

  app.setNotFoundHandler((req, rep) => {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND);
  });

  app.register(fastifyCors, {
    origin: config.node.environment === NodeEnvironment.Development ? '*' : config.frontend.url,
  });

  app.get('/', (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Project',
      api: 'Meiling Endpoints',
    });
  });

  app.register(sessionPlugin, { prefix: '/session' });
  app.register(sessionRequiredPlugin);
  done();
}

function sessionRequiredPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.addHook('onRequest', async (req, rep) => {
    const session = await Meiling.V1.Session.getSessionFromRequest(req);
    if (!session) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_SESSION);
    }

    (req as FastifyRequestWithSession).session = session;
    Object.freeze(session);
  });

  app.addSchema({
    $id: 'MeilingV1SigninAuthnData',
    type: 'object',
    properties: {
      method: { type: 'string', enum: Object.values(Meiling.V1.Interfaces.ExtendedAuthMethods), nullable: true },
      challengeResponse: { type: 'string', nullable: true },
      challengeContext: { $ref: 'Any#' },
    },
  });

  app.post(
    '/signin',
    {
      schema: {
        description: 'Endpoint to sign-in current session into specified account',
        tags: ['meiling'],
        summary: 'Signin',
        security: [{ sessionV1: [] }],
        params: {},
        body: {
          oneOf: [
            {
              type: 'object',
              properties: {
                type: { type: 'string', enum: [Meiling.V1.Interfaces.SigninType.USERNAME_CHECK] },
                data: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                  },
                },
              },
            },
            {
              type: 'object',
              properties: {
                type: { type: 'string', enum: [Meiling.V1.Interfaces.SigninType.USERNAME_AND_PASSWORD] },
                data: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
            {
              type: 'object',
              properties: {
                type: { type: 'string', enum: [Meiling.V1.Interfaces.SigninType.TWO_FACTOR_AUTH] },
                data: {
                  $ref: 'MeilingV1SigninAuthnData#',
                },
              },
            },
          ],
        },
        response: {
          200: {
            oneOf: [
              {
                type: 'object',
                description:
                  '(on username check) When the user was previously logged in and matches only one user, returns abstract user info.',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    description: 'abstract user data',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      profileId: { type: 'string', format: 'uri', nullable: true },
                      name: { type: 'string', nullable: true },
                      username: { type: 'string' },
                    },
                    nullable: true,
                  },
                },
              },
              {
                type: 'object',
                description: '(on 2fa session) When user requests available 2fa methods, this is how meiliNG returns.',
                properties: {
                  methods: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: Object.values(Meiling.V1.Interfaces.ExtendedAuthMethods),
                    },
                  },
                },
              },
              {
                type: 'object',
                description:
                  '(on 2fa session) When user requests challenge of 2fa, this is how server provides challenge or request user to reply with challenge',
                properties: {
                  to: { type: 'string', nullable: true },
                  type: {
                    type: 'string',
                    enum: [
                      Meiling.V1.Interfaces.SigninType.TWO_FACTOR_AUTH,
                      Meiling.V1.Interfaces.SigninType.PASSWORDLESS,
                    ],
                  },
                  challenge: { $ref: 'Any#' },
                },
              },
            ],
          },
          '4xx': {
            $ref: 'MeilingV1Error#',
          },
          '5xx': {
            $ref: 'MeilingV1Error#',
          },
        },
      },
    },
    signinHandler,
  );

  app.register(signupPlugin, { prefix: '/signup' });

  app.post(
    '/lost-password',
    {
      schema: {
        summary: 'Password Recovery (Lost Password)',
        description: 'Provides Password recovery flow',
        tags: ['meiling'],
        security: [{ sessionV1: [] }],
        params: {},
        body: {
          oneOf: [
            {
              type: 'object',
              properties: {
                password: { type: 'string' },
              },
              required: ['password'],
            },
            {
              type: 'object',
              properties: {
                context: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                  },
                  required: ['username'],
                },
                method: {
                  type: 'string',
                  enum: Object.values(Meiling.V1.Interfaces.ExtendedAuthMethods),
                  nullable: true,
                },
                data: {
                  type: 'object',
                },
              },
              required: ['context'],
            },
            // {},
          ],
        },
        response: {
          '4xx': {
            $ref: 'MeilingV1Error#',
          },
          '5xx': {
            $ref: 'MeilingV1Error#',
          },
        },
      },
    },
    lostPasswordHandler,
  );

  app.register(signoutPlugin, { prefix: '/signout' });

  app.register(userPlugin, { prefix: '/users' });
  app.register(appsPlugin, { prefix: '/apps' });

  app.register(meilingV1SessionAuthnPlugin, { prefix: '/authn' });

  done();
}

export default meilingV1Plugin;
