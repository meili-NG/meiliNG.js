import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getPrismaClient } from '../../../../resources/prisma';
import appAdminInfoHandler from './get';

const appsAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', async (req, rep) => {
    const apps = await getPrismaClient().oAuthClient.findMany({});

    rep.send(apps);
  });

  app.register(appAdminHandler, { prefix: '/:clientId' });

  done();
};

const appAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', appAdminInfoHandler);

  done();
};

export default appsAdminHandler;
