import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { User } from '../../../../common';
import { getPrismaClient } from '../../../../resources/prisma';
import { sendMeilingError } from '../../meiling/error';
import { MeilingV1ErrorType } from '../../meiling/interfaces';

const usersAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', async (req, rep) => {
    const { query, pageSize, page } = (req.query as any) || {};

    const paginationDetails: {
      skip?: number;
      take?: number;
    } =
      pageSize && page
        ? {
            skip: (pageSize * (page - 1)) as number,
            take: pageSize as number,
          }
        : {};

    const users = await getPrismaClient().user.findMany({
      where: query
        ? {
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
          }
        : undefined,
      ...paginationDetails,
    });

    rep.send(
      await Promise.all(
        users.map(async (user) => {
          return await User.getDetailedInfo(user);
        }),
      ),
    );
  });

  app.register(userAdminHandler, { prefix: '/:uuid' });

  done();
};

const userAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.addHook('onRequest', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;

    const user = await User.getDetailedInfo(uuid);
    if (!user) {
      sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
      throw new Error('user not found');
    }
  });

  app.get('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;

    const user = await User.getDetailedInfo(uuid);
    if (!user) {
      sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
      throw new Error('user not found');
    }

    rep.send(user);
  });

  done();
};

export default usersAdminHandler;
