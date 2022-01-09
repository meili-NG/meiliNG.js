import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { Meiling } from '../../../../../../../common';

async function get2FAInfo(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const methods = Object.values(Meiling.V1.Interfaces.ExtendedAuthMethods);

  rep.send({
    enabled: user.useTwoFactor,
    methods: await Promise.all(
      methods.map(async (n) => {
        const dbType = Meiling.V1.Database.convertAuthentication(n);
        const isAvailable =
          (await getPrismaClient().authorization.count({
            where: {
              user: {
                id: user.id,
              },
              method: dbType,
            },
          })) > 0;

        const is2FAEnabled =
          (await getPrismaClient().authorization.count({
            where: {
              user: {
                id: user.id,
              },
              method: dbType,
              allowTwoFactor: true,
            },
          })) > 0;

        const isPasswordlessEnabled =
          (await getPrismaClient().authorization.count({
            where: {
              user: {
                id: user.id,
              },
              method: dbType,
              allowSingleFactor: true,
            },
          })) > 0;

        const isPasswordResetEnabled =
          (await getPrismaClient().authorization.count({
            where: {
              user: {
                id: user.id,
              },
              method: dbType,
              allowPasswordReset: true,
            },
          })) > 0;

        return {
          enabled: {
            '2fa': is2FAEnabled,
            passwordless: isPasswordlessEnabled,
            passwordReset: isPasswordResetEnabled,
          },
          method: n,
          available: isAvailable,
        };
      }),
    ),
  });
}

export default get2FAInfo;
