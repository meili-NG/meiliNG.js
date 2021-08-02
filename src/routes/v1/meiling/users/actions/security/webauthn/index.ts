import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { Token, Utils } from '../../../../../../../common';
import config from '../../../../../../../resources/config';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { MeilingV1Session } from '../../../../common';
import { convertAuthentication } from '../../../../common/database';
import { getSessionFromRequest } from '../../../../common/session';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType, MeilingV1ExtendedAuthMethods } from '../../../../interfaces';
import userWebAuthnActionsPlugin from './actions';

function userWebAuthnPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', async (req, rep) => {
    const user = await getUserFromActionRequest(req);
    if (!user) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
      return;
    }

    const dbType = convertAuthentication(MeilingV1ExtendedAuthMethods.SECURITY_KEY);

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
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
      return;
    }

    if (Utils.isNotBlank(body.challenge)) {
      // TODO: Implement registration procedure
    } else {
      const challenge = Token.generateToken(64);

      await MeilingV1Session.setSession(req, {
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
        rp: {
          id: config.openid.issuingAuthority,
        },
        challenge,
      });
    }
  });

  app.register(userWebAuthnActionsPlugin, { prefix: '/:tokenId' });

  done();
}

export default userWebAuthnPlugin;