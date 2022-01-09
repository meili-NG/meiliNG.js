import bcrypt from 'bcryptjs';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PasswordChangeBody } from '.';
import { getUserFromActionRequest } from '../..';
import { Meiling, Utils } from '../../../../../../../common';
import { getPrismaClient } from '../../../../../../../resources/prisma';

export async function userPasswordUpdateHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await getUserFromActionRequest(req)) as Meiling.Identity.User.UserInfoObject;

  const body = req.body as PasswordChangeBody;
  if (!Utils.isValidValue(body, body?.password, body?.newPassword)) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid body.');
    return;
  }

  const password = body.password;
  const passwordRowsToChange = await Meiling.Identity.User.checkPassword(user, password);
  if (passwordRowsToChange.length === 0) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.WRONG_PASSWORD, 'wrong password.');
    return;
  }

  const newPassword = body.newPassword;
  if ((await Meiling.Identity.User.checkPassword(user, newPassword)).length > 0) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.EXISTING_PASSWORD,
      'existing password is used as new password.',
    );
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
