import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Meiling } from '../../../../common';
import { getPrismaClient } from '../../../../resources/prisma';

const tokensAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.addHook('onRequest', async (req, rep) => {
    const token = (req.query as { token: string }).token;
    if (!token || token.trim() === '') {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'Invalid query');
    }

    const tokenData = await getPrismaClient().oAuthToken.findFirst({
      where: {
        token,
      },
    });

    if (!tokenData) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND, 'Session was not found');
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
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND, 'Session was not found');
    }

    const data = await Meiling.Authentication.Token.serialize(tokenData.token, tokenData.type);

    rep.send({
      ...tokenData,
      ...data,
      expires_at: new Date(
        Meiling.Authentication.Token.getExpiresInByType(tokenData.type, new Date()) * 1000 +
          new Date(tokenData.issuedAt).getTime(),
      ),
      is_valid: await Meiling.Authentication.Token.isValid(token, tokenData.type),
      issued_at: tokenData.issuedAt,
      issuedAt: undefined,
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
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND, 'Session was not found');
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
