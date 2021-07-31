import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { AuthorizationPGPSSHKeyObject } from '../../../../../../../common/user';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../common/database';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType, MeilingV1ExtendedAuthMethods } from '../../../../interfaces';

function userPGPPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', async (req, rep) => {
    const user = await getUserFromActionRequest(req);
    if (!user) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
      return;
    }

    const dbType = convertAuthentication(MeilingV1ExtendedAuthMethods.PGP_SIGNATURE);

    const pgpKeys = await getPrismaClient().authorization.findMany({
      where: {
        user: {
          id: user.id,
        },
        method: dbType,
      },
    });

    rep.send(
      pgpKeys.map((n) => ({
        name: (n.data as any).data.name,
        key: (n.data as unknown as AuthorizationPGPSSHKeyObject).data.key,
      })),
    );
  });

  done();
}

export default userPGPPlugin;
