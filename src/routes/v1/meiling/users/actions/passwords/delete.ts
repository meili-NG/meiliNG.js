import { FastifyReply, FastifyRequest } from 'fastify';
import { PasswordBody } from '.';
import { meilingV1UserActionGetUser } from '..';
import { prisma } from '../../../../../..';
import { User } from '../../../../../../common';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';

export async function meilingV1OAuthClientPasswordsDeleteHandler(req: FastifyRequest, rep: FastifyReply) {
  const user = await meilingV1UserActionGetUser(req);
  const body = req.body as PasswordBody;

  if (user === undefined) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request.');
    return;
  } else if (user === null) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'you are not logged in as specified user.');
    return;
  }

  if (!body?.password) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request.');
    return;
  }

  const passwordsRaw = (await User.checkPassword(user, body.password)).filter((n) => n !== undefined);
  for (const passwordRaw of passwordsRaw) {
    if (passwordRaw) {
      await prisma.authorization.delete({
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
