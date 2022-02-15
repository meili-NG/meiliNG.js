import { FastifyReply, FastifyRequest } from 'fastify';
import { PasswordBody } from '.';
import { getUserFromActionRequest } from '../..';
import { Meiling } from '../../../../../../../common';
import { getPrismaClient } from '../../../../../../../resources/prisma';

export async function userPasswordDeleteHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await getUserFromActionRequest(req)) as Meiling.Identity.User.UserInfoObject;
  const body = req.body as PasswordBody;

  if (!body?.password) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid request.');
    return;
  }

  const passwordsRaw = (await Meiling.Identity.User.checkPassword(user, body.password)).filter((n) => n !== undefined);
  for (const passwordRaw of passwordsRaw) {
    if (passwordRaw) {
      await getPrismaClient().authentication.delete({
        where: {
          id: passwordRaw?.id,
        },
      });
    }
  }

  rep.send({
    success: passwordsRaw.length > 0,
  });
}
