import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { Meiling, Utils } from '../../../../../../../common';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import crypto from 'crypto';
import userOTPActionPostKey from './actions/post';
import userOTPActionsPlugin from './actions';

function userOTPPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', async (req, rep) => {
    const user = await getUserFromActionRequest(req);
    if (!user) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
      return;
    }

    const dbType = Meiling.V1.Database.convertAuthentication(Meiling.V1.Interfaces.ExtendedAuthMethods.OTP);

    const otps = await getPrismaClient().authentication.findMany({
      where: {
        user: {
          id: user.id,
        },
        method: dbType,
      },
    });

    // TODO: Implement sanitizing
    rep.send(
      otps.map((n) => ({
        id: n.id,
        createdAt: n.createdAt,
        name: (n.data as any)?.data?.name,
      })),
    );
  });

  app.post('/', userOTPActionPostKey);

  app.register(userOTPActionsPlugin, { prefix: '/:tokenId' });

  done();
}

export default userOTPPlugin;
