import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Meiling } from '../../../../common';
import { getPrismaClient } from '../../../../resources/prisma';

const userSessionsAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
  app.get('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;

    const user = await Meiling.Identity.User.getDetailedInfo(uuid);
    if (!user) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
      throw new Error('user not found');
    }

    const { query, pageSize = 20, page = 1, rawQuery = false } = (req.query as any) || {};

    const paginationDetails: {
      skip?: number;
      take?: number;
    } =
      pageSize && page
        ? {
            skip: (Number(pageSize) * (Number(page) - 1)) as number,
            take: Number(pageSize) as number,
          }
        : {};

    let prismaQuery = undefined;

    if (query !== undefined && rawQuery) {
      try {
        prismaQuery = JSON.parse(query);
      } catch (e) {
        Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid prisma query');
        return;
      }
    }

    const userLoggedInJson = { id: user.id };

    const userSessions = await getPrismaClient().meilingSessionV1Token.findMany({
      where: {
        session: {
          path: '$.user',
          array_contains: userLoggedInJson,
        },
        ...prismaQuery,
      },
      ...paginationDetails,
    });

    rep.send(userSessions);
  });

  done();
};

export default userSessionsAdminHandler;
