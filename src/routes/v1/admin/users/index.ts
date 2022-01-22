import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Meiling, Utils } from '../../../../common';
import { getPrismaClient } from '../../../../resources/prisma';
import userEmailsAdminHandler from './emails';
import userPhonesAdminHandler from './phones';
import userSessionsAdminHandler from './sessions';

const queryBuilder = (query: string) => ({
  OR: [
    {
      username: {
        contains: query,
      },
    },
    {
      name: {
        contains: query,
      },
    },
    {
      familyName: {
        contains: query,
      },
    },
    {
      givenName: {
        contains: query,
      },
    },
    {
      middleName: {
        contains: query,
      },
    },
    {
      emails: {
        some: {
          email: {
            contains: query,
          },
        },
      },
    },
    {
      phones: {
        some: {
          phone: {
            contains: query,
          },
        },
      },
    },
  ],
});

const usersAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
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

    const users = await getPrismaClient().user.findMany({
      where: prismaQuery,
      ...paginationDetails,
    });

    rep.send(
      await Promise.all(
        users.map(async (user) => {
          return await Meiling.Identity.User.getDetailedInfo(user);
        }),
      ),
    );
  });

  app.get('/count', async (req, rep) => {
    const { query, rawQuery = false } = (req.query as any) || {};

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

    const count = await getPrismaClient().user.count({
      where: prismaQuery,
    });

    rep.send({
      count,
    });
  });

  app.register(userAdminHandler, { prefix: '/:uuid' });

  done();
};

const userAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.addHook('onRequest', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;

    const user = await Meiling.Identity.User.getDetailedInfo(uuid);
    if (!user) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
      throw new Error('user not found');
    }
  });

  app.get('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;

    const user = await Meiling.Identity.User.getDetailedInfo(uuid);
    if (!user) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
      throw new Error('user not found');
    }

    rep.send(user);
  });

  // add user post

  app.put('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;
    const body = req.body as any;

    const user = await Meiling.Identity.User.getInfo(uuid);
    if (!user) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
      throw new Error('user not found');
    }

    await getPrismaClient().user.update({
      where: {
        id: uuid,
      },
      data: {
        birthday: body.birthday ? new Date(body.birthday) : undefined,
        familyName: Utils.isNotBlank(body.familyName) ? body.familyName : undefined,
        givenName: Utils.isNotBlank(body.givenName) ? body.givenName : undefined,
        middleName: Utils.isNotBlank(body.middleName) ? body.middleName?.normalize('NFC') : undefined,
        name: Utils.isNotBlank(body.name) ? body.name : undefined,
        metadata: body.metadata !== undefined ? body.metadata : undefined,
        lockedProps: body.lockedProps !== undefined ? body.lockedProps : undefined,
      },
    });

    rep.send({ success: true });
  });

  app.register(userEmailsAdminHandler, { prefix: '/emails' });
  app.register(userPhonesAdminHandler, { prefix: '/phones' });
  app.register(userSessionsAdminHandler, { prefix: '/sessions' });

  done();
};

export default usersAdminHandler;
