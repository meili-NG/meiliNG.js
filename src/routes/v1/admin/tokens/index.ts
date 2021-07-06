import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Token } from '../../../../common';
import { getPrismaClient } from '../../../../resources/prisma';
import { sendMeilingError } from '../../meiling/error';
import { MeilingV1ErrorType } from '../../meiling/interfaces';

const tokensAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.addHook('onRequest', async (req, rep) => {
    const token = (req.query as { token: string }).token;
    if (!token || token.trim() === '') {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
      throw new Error('invalid query');
    }

    const tokenData = await getPrismaClient().oAuthToken.findFirst({
      where: {
        token,
      },
    });

    if (!tokenData) {
      sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
      throw new Error('session not found');
    }
  });

  app.get('/', async (req, rep) => {
    const token = (req.query as { token: string }).token;

    const tokenData = await getPrismaClient().oAuthToken.findFirst({
      where: {
        token,
      },
    });

    if (!tokenData) {
      sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
      throw new Error('session not found');
    }

    const data = await Token.serialize(tokenData.token, tokenData.type);

    rep.send({
      ...tokenData,
      ...data,
    });
  });

  app.put('/', async (req, rep) => {
    const token = (req.query as { token: string }).token;
    const body = req.body as any | undefined;

    const tokenDataOld = await getPrismaClient().oAuthToken.findFirst({
      where: {
        token,
      },
    });

    if (!tokenDataOld) {
      sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
      throw new Error('session not found');
    }

    const tokenData = await getPrismaClient().meilingSessionV1Token.findFirst({
      where: {
        token,
      },
    });

    rep.send(tokenData);
  });

  app.delete('/', async (req, rep) => {
    const token = (req.query as { token: string }).token;

    await getPrismaClient().oAuthToken.delete({
      where: {
        token,
      },
    });

    rep.send({ success: true });
  });

  done();
};

export default tokensAdminHandler;
