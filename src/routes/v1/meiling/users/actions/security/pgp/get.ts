import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { AuthorizationPGPSSHKeyObject } from '../../../../../../../common/user';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../common/database';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType, MeilingV1ExtendedAuthMethods } from '../../../../interfaces';

const dbType = convertAuthentication(MeilingV1ExtendedAuthMethods.PGP_SIGNATURE);

async function userPGPGetKeys(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
    return;
  }

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
      id: n.id,
      createdAt: n.createdAt,
      name: (n.data as any).data.name,
      key: (n.data as unknown as AuthorizationPGPSSHKeyObject).data.key,

      allowSingleFactor: n.allowSingleFactor,
      allowTwoFactor: n.allowTwoFactor,
      allowPasswordReset: n.allowPasswordReset,
    })),
  );
}

export default userPGPGetKeys;
