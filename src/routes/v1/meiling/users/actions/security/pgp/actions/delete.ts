import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { Meiling, Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../../../../../common/meiling/v1/database';
import { sendMeilingError } from '../../../../../../../../common/meiling/v1/error/error';

const dbType = convertAuthentication(Meiling.V1.Interfaces.MeilingV1ExtendedAuthMethods.PGP_SIGNATURE);

async function userPGPActionDeleteKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const pgpId = (req.params as any).pgpId;
  if (!Utils.isNotBlank(pgpId)) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }

  const checkExist =
    (await getPrismaClient().authorization.count({
      where: {
        user: {
          id: user.id,
        },
        method: dbType,
        id: pgpId,
      },
    })) > 0;

  if (!checkExist) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
    return;
  }

  await getPrismaClient().authorization.delete({
    where: {
      id: pgpId,
    },
  });

  await Meiling.Identity.User.prevent2FALockout(user.id);

  rep.send({ success: true });
}

export default userPGPActionDeleteKey;
