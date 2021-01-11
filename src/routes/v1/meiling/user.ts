import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { getAllUserByID } from '../../../common/user';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType, MeilingV1Session } from './interfaces';

export async function meilingV1UserInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = req.session.get('meiling-v1') as MeilingV1Session | null | undefined;

  if (session?.user?.ids) {
    const userIds = session.user.ids;

    const users = [];

    for (const userId of userIds) {
      const user = await getAllUserByID(userId);
      users.push(user);
    }

    rep.send({
      users,
    });
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'You are not logged in.');
    return;
  }
}
