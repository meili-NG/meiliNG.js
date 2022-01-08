import { FastifyReply, FastifyRequest } from 'fastify';
import { PasswordBody } from '.';
import { getUserFromActionRequest } from '../..';
import { Meiling } from '../../../../../../../common';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType } from '../../../../interfaces';

export async function userPasswordDeleteHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await getUserFromActionRequest(req)) as Meiling.Identity.User.UserInfoObject;
  const body = req.body as PasswordBody;

  if (!body?.password) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request.');
    return;
  }

  const passwordsRaw = (await Meiling.Identity.User.checkPassword(user, body.password)).filter((n) => n !== undefined);
  for (const passwordRaw of passwordsRaw) {
    if (passwordRaw) {
      await getPrismaClient().authorization.delete({
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
