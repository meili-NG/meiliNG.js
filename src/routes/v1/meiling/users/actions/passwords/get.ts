import { FastifyReply, FastifyRequest } from 'fastify';
import { meilingV1UserActionGetUser } from '..';
import { User } from '../../../../../../common';

export async function meilingV1OAuthClientPasswordsGetHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await meilingV1UserActionGetUser(req)) as User.UserInfoObject;
  const passwordsRaw = (await User.getPasswords(user)).filter((n) => n !== undefined);

  const passwords = passwordsRaw.map((n) => {
    return { id: n?.id, createdAt: n?.createdAt };
  });

  rep.send({
    passwords,
  });
}
