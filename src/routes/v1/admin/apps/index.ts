import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Meiling } from '../../../../common';
import { getPrismaClient } from '../../../../resources/prisma';
import appAdminInfoHandler from './get';
import appAdminPutHandler from './put';

function queryBuilder(query: string) {
  return {
    name: query,
  };
}

const appsAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', async (req, rep) => {
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

    if (query !== undefined) {
      try {
        prismaQuery = JSON.parse(query);
      } catch (e) {
        if (rawQuery) {
          Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid prisma query');
          return;
        } else if (typeof query === 'string') {
          prismaQuery = queryBuilder(query);
        }
      }
    }

    const apps = await getPrismaClient().oAuthClient.findMany({
      where: prismaQuery,
      ...paginationDetails,
    });

    rep.send(apps);
  });

  app.register(appAdminHandler, { prefix: '/:clientId' });

  done();
};

const appAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', appAdminInfoHandler);
  app.put('/', appAdminPutHandler);

  done();
};

export default appsAdminHandler;
