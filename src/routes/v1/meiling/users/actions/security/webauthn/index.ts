import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { Meiling, Utils } from '../../../../../../../common';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import userWebAuthnActionsPlugin from './actions';
import crypto from 'crypto';

function userWebAuthnPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', async (req, rep) => {
    const user = await getUserFromActionRequest(req);
    if (!user) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
      return;
    }

    const dbType = Meiling.V1.Database.convertAuthentication(Meiling.V1.Interfaces.ExtendedAuthMethods.SECURITY_KEY);

    const securityKeys = await getPrismaClient().authentication.findMany({
      where: {
        user: {
          id: user.id,
        },
        method: dbType,
      },
    });

    // TODO: Implement sanitizing
    rep.send(
      securityKeys.map((n) => ({
        id: n.id,
        createdAt: n.createdAt,
      })),
    );
  });

  app.post('/', async (req, rep) => {
    const body = req.body as any;
    const session = await Meiling.V1.Session.getSessionFromRequest(req);
    const user = await getUserFromActionRequest(req);

    if (!user || !session) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
      return;
    }

    if (Utils.isNotBlank(body.id, body.hostname, body.response, body.response?.attenationObject, body)) {
      // TODO: Implement registration procedure
    } else {
      const challenge = crypto.randomBytes(64);

      await Meiling.V1.Session.setSession(req, {
        ...session,
        registering: {
          webAuthn: {
            challenge: challenge.toString('base64'),
          },
        },
      });

      rep.send({
        user: {
          id: user.id,
          name: user.username,
          displayName: user.name,
          icon: user.profileUrl ? user.profileUrl : undefined,
        },
        challenge: challenge.toString('base64'),
      });
    }
  });

  app.register(userWebAuthnActionsPlugin, { prefix: '/:tokenId' });

  done();
}

export default userWebAuthnPlugin;
