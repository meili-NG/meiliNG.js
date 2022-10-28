import { exec } from 'child_process';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Meiling } from '../../../../common';
import { getPrismaClient } from '../../../../resources/prisma';
import permissionAdminInfoHandler from './get';
import permissionAdminPutHandler from './put';

function queryBuilder(query: string) {
  return {
    name: query,
  };
}

const permissionsAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', async (req, rep) => {
    let { query } = (req.query as any) || {};
    const { pageSize = 20, page = 1, rawQuery = false } = (req.query as any) || {};
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
        if (rawQuery) {
          throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid prisma query');
          return;
        } else if (typeof query === 'string') {
          prismaQuery = queryBuilder(query);
        }
      }
    }

    const apps = await getPrismaClient().permission.findMany({
      where: prismaQuery,
      ...paginationDetails
    });

    rep.send(apps);
  });

  app.post('/', async (req, rep) => {
    const body = req.body as { name: string; isAvailable?: boolean; };
    const res = await getPrismaClient().permission.create({
      data: {
        name: body.name,
        isAvailable: body.isAvailable,
      }
    });

    rep.send(res);
  });

  app.register(permissionAdminHandler, { prefix: '/:name' });

  done();
};

const permissionAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', permissionAdminInfoHandler);
  app.put('/', permissionAdminPutHandler);

  done();
};

export default permissionsAdminHandler;
