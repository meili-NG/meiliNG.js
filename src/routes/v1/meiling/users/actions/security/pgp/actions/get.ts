import { raw } from '@prisma/client/runtime';
import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { Utils } from '../../../../../../../../common';
import { AuthorizationPGPSSHKeyObject } from '../../../../../../../../common/user';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../../common/database';
import { sendMeilingError } from '../../../../../error';
import { MeilingV1ExtendedAuthMethods, MeilingV1ErrorType } from '../../../../../interfaces';

const dbType = convertAuthentication(MeilingV1ExtendedAuthMethods.PGP_SIGNATURE);

async function userPGPActionGetKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
    return;
  }

  const pgpId = (req.params as any).pgpId;
  if (!Utils.isNotBlank(pgpId)) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
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
    sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
    return;
  }

  rep.send({
    id: keyData.id,
    createdAt: keyData.createdAt,
    name: (keyData.data as any).data.name,
    key: (keyData.data as unknown as AuthorizationPGPSSHKeyObject).data.key,

    allowSingleFactor: keyData.allowSingleFactor,
    allowTwoFactor: keyData.allowTwoFactor,
    allowPasswordReset: keyData.allowPasswordReset,
  });
}

export default userPGPActionGetKey;
