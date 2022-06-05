import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { Meiling, Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { Fido2Lib } from 'fido2-lib';
import config from '../../../../../../../../resources/config';

const dbType = Meiling.V1.Database.convertAuthentication(Meiling.V1.Interfaces.ExtendedAuthMethods.SECURITY_KEY);

async function userWebAuthnActionPostKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  let hostname = (req.params as any).hostname;
  if (!Utils.isNotBlank(hostname)) {
    hostname = config.frontend.url[0];
  }

  if (!config.frontend.url.includes(hostname)) {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.INVALID_REQUEST,
      'provided hostname is not supported',
    );
  }

  Fido2Lib;
  throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_IMPLEMENTED);
}

export default userWebAuthnActionPostKey;
