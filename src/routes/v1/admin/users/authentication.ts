import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getPrismaClient } from '../../../../resources/prisma';
import { Meiling } from '../../../../common';

const userAuthnsAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
  app.get('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;

    const authns = await getPrismaClient().authentication.findMany({
      where: {
        user: {
          id: uuid,
        },
      },
    });

    rep.send(authns);
  });

  app.post('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;
    const user = await Meiling.Identity.User.getInfo(uuid);

    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_IMPLEMENTED);
  });

  app.register(userAuthnAdminHandler, { prefix: '/:authnId' });

  done();
};

const userAuthnAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
  app.get('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;
    const authnId = (req.params as { authnId: string }).authnId;

    const authn = await getPrismaClient().authentication.findFirst({
      where: {
        user: {
          id: uuid,
        },
        id: authnId,
      },
    });

    if (authn === null) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
      return;
    }

    rep.send(authn);
  });

  app.delete('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;
    const authnId = (req.params as { authnId: string }).authnId;

    const authn = await getPrismaClient().authentication.findFirst({
      where: {
        user: {
          id: uuid,
        },
        id: authnId,
      },
    });

    if (authn === null) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
      return;
    }

    await getPrismaClient().authentication.delete({
      where: {
        id: authnId,
      },
    });
  });

  done();
};

export default userAuthnsAdminHandler;
