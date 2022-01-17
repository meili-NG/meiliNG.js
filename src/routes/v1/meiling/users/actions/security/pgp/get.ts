import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { Meiling } from '../../../../../../../common';

const dbType = Meiling.V1.Database.convertAuthentication(Meiling.V1.Interfaces.ExtendedAuthMethods.PGP_SIGNATURE);

async function userPGPGetKeys(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED);
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
      key: (n.data as unknown as Meiling.Identity.User.AuthenticationPGPSSHKeyObject).data.key,

      allowSingleFactor: n.allowSingleFactor,
      allowTwoFactor: n.allowTwoFactor,
      allowPasswordReset: n.allowPasswordReset,
    })),
  );
}

export default userPGPGetKeys;
