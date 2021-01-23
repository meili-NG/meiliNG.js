import { FastifyReply, FastifyRequest } from 'fastify';
import { PasswordBody } from '.';
import { meilingV1UserActionGetUser } from '..';
import { User } from '../../../../../../common';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';

export async function meilingV1OAuthClientPasswordsGetHandler(req: FastifyRequest, rep: FastifyReply) {
  const user = await meilingV1UserActionGetUser(req);
  const body = req.body as PasswordBody;

  if (user === undefined) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request.');
    return;
  } else if (user === null) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'you are not logged in as specified user.');
    return;
  }

  const passwordsRaw = (await User.getPasswords(user)).filter((n) => n !== undefined);

  const passwords = passwordsRaw.map((n) => {
    return { id: n?.id, createdAt: n?.createdAt };
  });

  rep.send({
    passwords,
  });
}
