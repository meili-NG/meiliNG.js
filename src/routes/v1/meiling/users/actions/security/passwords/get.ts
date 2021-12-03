import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../..';
import { User } from '../../../../../../../common';

export async function userPasswordGetHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await getUserFromActionRequest(req)) as User.UserInfoObject;
  const passwordsRaw = (await User.getPasswords(user)).filter((n) => n !== undefined);

  const passwords = passwordsRaw.map((n) => {
    return { id: n?.id, createdAt: n?.createdAt };
  });

  rep.send({
    passwords,
  });
}
