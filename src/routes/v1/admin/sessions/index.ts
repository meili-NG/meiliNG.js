import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getPrismaClient } from '../../../../resources/prisma';
import { sendMeilingError } from '../../meiling/error';
import { MeilingV1ErrorType } from '../../meiling/interfaces';

const sessionsAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.addHook('onRequest', async (req, rep) => {
    const token = (req.query as { token: string }).token;
    if (!token || token.trim() === '') {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
      throw new Error('invalid query');
    }

    const tokenData = await getPrismaClient().meilingSessionV1Token.findFirst({
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

    const tokenData = await getPrismaClient().meilingSessionV1Token.findFirst({
      where: {
        token,
      },
    });

    if (!tokenData) {
      sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
      throw new Error('session not found');
    }

    rep.send(tokenData);
  });

  app.put('/', async (req, rep) => {
    const token = (req.query as { token: string }).token;
    const body = req.body as any | undefined;

    const tokenDataOld = await getPrismaClient().meilingSessionV1Token.findFirst({
      where: {
        token,
      },
    });

    if (!tokenDataOld) {
      sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
      throw new Error('session not found');
    }

    if (body?.ip) {
      await getPrismaClient().meilingSessionV1Token.update({
        where: {
          token,
        },
        data: {
          ip: body.ip,
        },
      });
    }

    if (body?.lastUsed) {
      await getPrismaClient().meilingSessionV1Token.update({
        where: {
          token,
        },
        data: {
          lastUsed: body.lastUsed,
        },
      });
    }

    if (body?.session) {
      await getPrismaClient().meilingSessionV1Token.update({
        where: {
          token,
        },
        data: {
          session: body.session,
        },
      });
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

    await getPrismaClient().meilingSessionV1Token.delete({
      where: {
        token,
      },
    });

    rep.send({ success: true });
  });

  done();
};

export default sessionsAdminHandler;
