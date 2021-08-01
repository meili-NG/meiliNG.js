import { raw } from '@prisma/client/runtime';
import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { User, Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../../common/database';
import { sendMeilingError } from '../../../../../error';
import { MeilingV1ExtendedAuthMethods, MeilingV1ErrorType } from '../../../../../interfaces';

const dbType = convertAuthentication(MeilingV1ExtendedAuthMethods.PGP_SIGNATURE);

async function userPGPActionPutKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
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

  if (!req.body) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
    return;
  }

  const body = (req.body as any) || {};

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

  await getPrismaClient().authorization.update({
    where: {
      id: pgpId,
    },
    data: {
      allowPasswordReset: typeof body?.allowPasswordReset === 'boolean' ? body.allowPasswordReset : undefined,
      allowSingleFactor: typeof body?.allowSingleFactor === 'boolean' ? body.allowSingleFactor : undefined,
      allowTwoFactor: typeof body?.allowTwoFactor === 'boolean' ? body.allowTwoFactor : undefined,
    },
  });

  await User.prevent2FALockout(user.id);

  rep.send({ success: true });
}

export default userPGPActionPutKey;
