import bcrypt from 'bcryptjs';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PasswordChangeBody } from '.';
import { getUserFromActionRequest } from '../..';
import { User, Utils } from '../../../../../../../common';
import { getPrismaClient } from '../../../../../../../resources/prisma';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType } from '../../../../interfaces';

export async function userPasswordUpdateHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await getUserFromActionRequest(req)) as User.UserInfoObject;

  const body = req.body as PasswordChangeBody;
  if (!Utils.isValidValue(body, body?.password, body?.newPassword)) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid body.');
    return;
  }

  const password = body.password;
  const passwordRowsToChange = await User.checkPassword(user, password);
  if (passwordRowsToChange.length === 0) {
    sendMeilingError(rep, MeilingV1ErrorType.WRONG_PASSWORD, 'wrong password.');
    return;
  }

  const newPassword = body.newPassword;
  if ((await User.checkPassword(user, newPassword)).length > 0) {
    sendMeilingError(rep, MeilingV1ErrorType.EXISTING_PASSWORD, 'existing password is used as new password.');
    return;
  }

  const salt = await bcrypt.genSalt(Utils.getCryptoSafeInteger(10) + 5);
  const hash = await bcrypt.hash(password, salt);

  const data = {
    type: 'PASSWORD',
    data: {
      hash: bcrypt.hashSync(newPassword, hash),
    },
  };

  for (const passwordRowToChange of passwordRowsToChange) {
    if (passwordRowToChange) {
      await getPrismaClient().authorization.update({
        where: {
          id: passwordRowToChange.id,
        },
        data: {
          data,
        },
      });
    }
  }

  rep.send({
    success: passwordRowsToChange.length > 0,
  });
}
