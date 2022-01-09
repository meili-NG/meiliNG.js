import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { convertAuthentication } from '../../../../../../../common/meiling/v1/database';
import { sendMeilingError } from '../../../../../../../common/meiling/v1/error/error';
import * as OpenPGP from 'openpgp';
import { Meiling, Utils } from '../../../../../../../common';
import { AuthorizationMethod } from '@prisma/client';

const dbType = convertAuthentication(Meiling.V1.Interfaces.MeilingV1ExtendedAuthMethods.PGP_SIGNATURE);

async function userPGPPostKeys(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const { name, key } = (req.body as any) || {};
  if (!Utils.isNotBlank(name, key)) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }

  try {
    const pgpKey = await OpenPGP.key.readArmored(key);

    if (pgpKey.err) {
      throw new Error();
    }

    await getPrismaClient().authorization.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        method: dbType as AuthorizationMethod,
        data: {
          type: dbType,
          data: {
            name,
            key,
          },
        },
        allowTwoFactor: true,
        allowSingleFactor: true,
        allowPasswordReset: true,
      },
    });

    rep.send({ success: true });
  } catch (e) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid pgp key');
    return;
  }
}

export default userPGPPostKeys;
