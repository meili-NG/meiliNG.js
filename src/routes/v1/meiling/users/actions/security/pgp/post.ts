import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import * as OpenPGP from 'openpgp';
import { Meiling, Utils } from '../../../../../../../common';
import { AuthenticationMethod } from '@prisma/client';

const dbType = Meiling.V1.Database.convertAuthentication(Meiling.V1.Interfaces.ExtendedAuthMethods.PGP_SIGNATURE);

async function userPGPPostKeys(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const { name, key } = (req.body as any) || {};
  if (!Utils.isNotBlank(name, key)) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }

  try {
    const pgpKey = await OpenPGP.key.readArmored(key);

    if (pgpKey.err) {
      throw new Error();
    }

    await getPrismaClient().authentication.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        method: dbType as AuthenticationMethod,
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
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid pgp key');
    return;
  }
}

export default userPGPPostKeys;
