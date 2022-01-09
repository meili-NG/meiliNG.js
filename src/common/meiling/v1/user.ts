import { Authorization, User } from '@prisma/client';
import { getPrismaClient } from '../../../resources/prisma';
import { ExtendedAuthMethods, SigninType } from './interfaces';
import { convertAuthentication } from './database';

export async function getAvailableExtendedAuthenticationMethods(
  user?: User | string,
  signinType?: SigninType | 'password_reset',
  signinMethod?: ExtendedAuthMethods,
): Promise<Authorization[]> {
  let uuid;
  if (user !== undefined) {
    if (typeof user === 'string') {
      uuid = user;
    } else {
      uuid = user.id;
    }
  } else {
    uuid = undefined;
  }

  let auths;

  if (signinType !== undefined) {
    auths = await getPrismaClient().authorization.findMany({
      where: {
        userId: uuid,
        allowSingleFactor: signinType === SigninType.PASSWORDLESS ? true : undefined,
        allowTwoFactor: signinType === SigninType.TWO_FACTOR_AUTH ? true : undefined,
        allowPasswordReset: signinType === 'password_reset' ? true : undefined,
        method: signinMethod !== undefined ? convertAuthentication(signinMethod) : undefined,
      },
    });
  } else {
    auths = await getPrismaClient().authorization.findMany({
      where: {
        userId: uuid,
        method: signinMethod !== undefined ? convertAuthentication(signinMethod) : undefined,
      },
    });
  }

  return auths;
}
