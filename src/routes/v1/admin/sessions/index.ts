import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getPrismaClient } from '../../../../resources/prisma';
import { Meiling } from '../../../../common';
import sessionAdminHandler from './crud';

const sessionsAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', async (req, rep) => {
    const token = (req.query as { token: string }).token;

    const isTokenQuery = !token || token.trim() === '';

    if (isTokenQuery) {
      const tokenData = await getPrismaClient().meilingSessionV1Token.findFirst({
        where: {
          token,
        },
      });

      if (!tokenData) return Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
      rep.send(tokenData);
      return;
    }

    const { query, pageSize = 20, page = 1 } = (req.query as any) || {};

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

    if (query !== undefined) {
      try {
        prismaQuery = JSON.parse(query);
      } catch (e) {
        return Meiling.V1.Error.sendMeilingError(
          rep,
          Meiling.V1.Error.ErrorType.INVALID_REQUEST,
          'invalid prisma query',
        );
      }
    }

    const sessions = await getPrismaClient().meilingSessionV1Token.findMany({
      where: prismaQuery,
      ...paginationDetails,
    });

    rep.send(sessions);
  });

  app.register(sessionAdminHandler);

  done();
};

export default sessionsAdminHandler;
