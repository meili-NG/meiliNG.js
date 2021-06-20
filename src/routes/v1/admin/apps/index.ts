import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getPrismaClient } from '../../../../resources/prisma';

const appsAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', async (req, rep) => {
    const apps = await getPrismaClient().oAuthClient.findMany({});

    rep.send(apps);
  });

  done();
};

export default appsAdminHandler;
