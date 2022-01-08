import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Meiling } from '../../../../common';
import { getByClientId } from '../../../../common/meiling/oauth2/client';
import { getPrismaClient } from '../../../../resources/prisma';
import { MeilingV1Session } from '../../meiling/common';
import { sendMeilingError } from '../../meiling/error';
import { MeilingV1ErrorType } from '../../meiling/interfaces';

const internalAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/sakuya', async (req, rep) => {
    try {
      console.log('[Sakuya] Running Garbage Collect for Meiling Sessions...');
      await MeilingV1Session.garbageCollect();

      console.log('[Sakuya] Running Garbage Collect for OAuth2 Tokens...');
      await Meiling.Authorization.Token.garbageCollect();

      console.log('[Sakuya] Running Garbage Collect for OAuth2 ACL Data...');
      await Meiling.OAuth2.ClientAuthorization.garbageCollect();

      rep.send({ success: true });
    } catch (e) {
      console.error(e);
      sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR);
    }
  });

  app.get('/export', async (req, rep) => {
    const clientsRaw = await getPrismaClient().oAuthClient.findMany({});

    const exportData = {
      _alert: "export feature is experimental and doesn't follow semver and might have breaking changes at the moment.",
      version: 0,
      data: {
        clients: await Promise.all(
          clientsRaw.map(async (n) => ({
            ...(await Meiling.OAuth2.Client.getInfoForOwners(n)),
          })),
        ),
        users: await Promise.all(
          (
            await getPrismaClient().user.findMany({})
          ).map(async (n) => ({
            ...(await Meiling.Identity.User.getDetailedInfo(n)),
          })),
        ),
      },
    };

    rep.send(exportData);
  });

  done();
};

export default internalAdminHandler;
