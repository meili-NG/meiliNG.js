import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getPrismaClient } from '../../../../resources/prisma';
import { Meiling } from '../../../../common';
import sessionAdminHandler from './crud';

const sessionsAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', async (req, rep) => {
    const token = (req.query as { token: string }).token;

    const isTokenQuery = token && token.trim() !== '';

    if (isTokenQuery) {
      const tokenData = await getPrismaClient().meilingSessionV1Token.findFirst({
        where: {
          token,
        },
      });

      if (!tokenData) throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND);
      rep.send(tokenData);
      return;
    }

    let { query } = (req.query as any) || {};
    const { pageSize = 20, page = 1 } = (req.query as any) || {};
    if (['bigint', 'boolean', 'number'].includes(typeof query)) query = query.toString();

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
        throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid prisma query');
      }
    }

    const sessions = await getPrismaClient().meilingSessionV1Token.findMany({
      where: prismaQuery,
      ...paginationDetails,
    });

    rep.send(sessions);
  });

  app.get('/count', async (req, rep) => {
    const { query } = (req.query as any) || {};
    let prismaQuery = undefined;

    if (query !== undefined) {
      try {
        prismaQuery = JSON.parse(query);
      } catch (e) {
        throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid prisma query');
      }
    }

    const count = await getPrismaClient().meilingSessionV1Token.count({
      where: prismaQuery,
    });

    rep.send({
      count,
    });
  });

  app.register(sessionAdminHandler);

  done();
};

export default sessionsAdminHandler;
