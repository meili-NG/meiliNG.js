import { getPrismaClient } from '../../../../resources/prisma';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Meiling } from '../../../../common';

const authAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.post('/login', async (req, rep) => {
    const query = req.query as {
      token?: string;
    };

    const body = req.body as {
      userId?: string;
      skip2FA?: boolean;
    };

    const token = query.token;
    const userId = body.userId;
    if (!userId || !token) {
      throw new Meiling.V1.Error.MeilingError(
        Meiling.V1.Error.ErrorType.INVALID_REQUEST,
        'Required parameters are missing',
      );
    }

    const session = await getPrismaClient().meilingSessionV1Token.findUnique({
      where: {
        token,
      },
    });

    if (!session) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND, 'Session was not found');
    }

    const user = await Meiling.Identity.User.getBasicInfo(userId);
    if (!user) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND, 'user was not found');
    }

    const sessionData = session.session as Meiling.V1.Interfaces.MeilingSession;
    if (!sessionData.previouslyLoggedIn) sessionData.previouslyLoggedIn = [];
    if (!sessionData.previouslyLoggedIn.map((n) => n.id).includes(userId)) {
      sessionData.previouslyLoggedIn.push({
        id: userId,
      });
    }

    if (!sessionData.user) sessionData.user = [];
    if (!sessionData.user.map((n) => n.id).includes(userId)) {
      sessionData.user.push({ id: userId });
    }

    if (body.skip2FA || !user.useTwoFactor) {
      await getPrismaClient().meilingSessionV1Token.update({
        where: {
          token,
        },
        data: {
          session: sessionData as any,
        },
      });

      rep.send({ success: true });
    } else {
      // TODO: Implement it properly
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.TWO_FACTOR_AUTHENTICATION_REQUIRED);
    }
  });

  done();
};

export default authAdminHandler;
