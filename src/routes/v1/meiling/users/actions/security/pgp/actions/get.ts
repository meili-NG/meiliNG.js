import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { Meiling, Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../../../../../common/meiling/v1/database';
import { sendMeilingError } from '../../../../../../../../common/meiling/v1/error/error';

const dbType = convertAuthentication(Meiling.V1.Interfaces.MeilingV1ExtendedAuthMethods.PGP_SIGNATURE);

async function userPGPActionGetKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
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

  const keyData = await getPrismaClient().authorization.findFirst({
    where: {
      user: {
        id: user.id,
      },
      method: dbType,
      id: pgpId,
    },
  });

  if (!keyData) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
    return;
  }

  rep.send({
    id: keyData.id,
    createdAt: keyData.createdAt,
    name: (keyData.data as any).data.name,
    key: (keyData.data as unknown as Meiling.Identity.User.AuthorizationPGPSSHKeyObject).data.key,

    allowSingleFactor: keyData.allowSingleFactor,
    allowTwoFactor: keyData.allowTwoFactor,
    allowPasswordReset: keyData.allowPasswordReset,
  });
}

export default userPGPActionGetKey;
