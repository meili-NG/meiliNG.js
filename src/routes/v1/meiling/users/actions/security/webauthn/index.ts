import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../common/database';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType, MeilingV1ExtendedAuthMethods } from '../../../../interfaces';

function userWebAuthnPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', async (req, rep) => {
    const user = await getUserFromActionRequest(req);
    if (!user) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
      return;
    }

    const dbType = convertAuthentication(MeilingV1ExtendedAuthMethods.SECURITY_KEY);

    const securityKeys = await getPrismaClient().authorization.findMany({
      where: {
        user: {
          id: user.id,
        },
        method: dbType,
      },
    });

    // TODO: Implement sanitizing
    rep.send(securityKeys.map((n) => ({})));
  });

  done();
}

export default userWebAuthnPlugin;
