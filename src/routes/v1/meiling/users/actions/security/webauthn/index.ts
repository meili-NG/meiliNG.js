import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { Meiling, Utils } from '../../../../../../../common';
import config from '../../../../../../../resources/config';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../../../../common/meiling/v1/database';
import { getSessionFromRequest } from '../../../../../../../common/meiling/v1/session';
import { sendMeilingError } from '../../../../../../../common/meiling/v1/error/error';
import userWebAuthnActionsPlugin from './actions';

function userWebAuthnPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', async (req, rep) => {
    const user = await getUserFromActionRequest(req);
    if (!user) {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED);
      return;
    }

    const dbType = convertAuthentication(Meiling.V1.Interfaces.MeilingV1ExtendedAuthMethods.SECURITY_KEY);

    const securityKeys = await getPrismaClient().authorization.findMany({
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
    const session = await getSessionFromRequest(req);
    const user = await getUserFromActionRequest(req);

    if (!user || !session) {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED);
      return;
    }

    if (Utils.isNotBlank(body.id, body.response, body.response?.attenationObject, body)) {
      // TODO: Implement registration procedure
    } else {
      const challenge = Meiling.Authorization.Token.generateToken(64);

      await Meiling.V1.Session.setSession(req, {
        ...session,
        registering: {
          webAuthn: {
            challenge,
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
        challenge,
      });
    }
  });

  app.register(userWebAuthnActionsPlugin, { prefix: '/:tokenId' });

  done();
}

export default userWebAuthnPlugin;
