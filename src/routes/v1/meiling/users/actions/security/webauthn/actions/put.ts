import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { Meiling, Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';

const dbType = Meiling.V1.Database.convertAuthentication(Meiling.V1.Interfaces.ExtendedAuthMethods.WEBAUTHN);

async function userWebAuthnActionPutKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const tokenId = (req.params as any).tokenId;
  if (!Utils.isNotBlank(tokenId)) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }

  if (!req.body) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }

  const body = (req.body as any) || {};

  const keyData = await getPrismaClient().authentication.findFirst({
    where: {
      user: {
        id: user.id,
      },
      method: dbType,
      id: tokenId,
    },
  });

  if (!keyData) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND);
    return;
  }

  await getPrismaClient().authentication.update({
    where: {
      id: tokenId,
    },
    data: {
      allowPasswordReset: typeof body?.allowPasswordReset === 'boolean' ? body.allowPasswordReset : undefined,
      allowSingleFactor: typeof body?.allowSingleFactor === 'boolean' ? body.allowSingleFactor : undefined,
      allowTwoFactor: typeof body?.allowTwoFactor === 'boolean' ? body.allowTwoFactor : undefined,
    },
  });

  await Meiling.Identity.User.prevent2FALockout(user.id);

  rep.send({ success: true });
}

export default userWebAuthnActionPutKey;
