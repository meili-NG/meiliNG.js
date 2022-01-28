import bcrypt from 'bcryptjs';
import { FastifyReply, FastifyRequest } from 'fastify';
import libmobilephoneJs from 'libphonenumber-js';
import { FastifyRequestWithSession } from '..';
import { Meiling, Utils } from '../../../../common';
import config from '../../../../resources/config';
import { getPrismaClient } from '../../../../resources/prisma';

interface MeilingV1Signup {
  username: string;
  phone: string;
  email: string;
  password: string;
  name: Utils.MeilingV1SignupName;
}

export async function signupHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const session = (req as FastifyRequestWithSession).session;
  const body = req.body as MeilingV1Signup;

  if (!Utils.isValidValue(body.username, body.email, body.phone, body.password)) {
    // you are out.
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.INVALID_REQUEST,
      `Invalid body (${['username', 'email', 'phone', 'password'].filter((n: string) => {
        return Utils.isValidValue(body[n as keyof MeilingV1Signup]);
      })})`,
    );
    return;
  }

  if (!Utils.isValidName(body.name)) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'Invalid Name');
    return;
  }

  const signupChallenge = await Meiling.V1.Session.getAuthenticationStatus(req);

  if (signupChallenge === undefined) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.AUTHORIZATION_REQUEST_NOT_GENERATED,
      'Signup Validation requests were not generated.',
    );
    return;
  }

  const name = body.name;

  const email = body.email;
  const password = body.password;
  const phone = libmobilephoneJs(body.phone);
  const username = body.username;

  // check user input is valid.

  if (!Utils.isValidUsername(username)) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.INVALID_REQUEST,
      'Username should be consisting alphanumeric characters and _, -, .',
    );
    return;
  }

  if (!Utils.isValidPassword(password)) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.INVALID_REQUEST,
      'password should contain at least 8 characters.',
    );
    return;
  }

  if (!phone) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.INVALID_REQUEST,
      'Phone number should be valid ITU compliant international number',
    );
    return;
  }

  if (!Utils.isValidEmail(email)) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.INVALID_REQUEST,
      'Entered email is NOT a valid email.',
    );
    return;
  }

  // check with validation.

  if (!(signupChallenge.email?.isVerified && signupChallenge.phone?.isVerified)) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.AUTHORIZATION_REQUEST_NOT_COMPLETED);
    return;
  }

  if (
    !(
      signupChallenge.email.to === email &&
      phone &&
      phone.formatInternational() === libmobilephoneJs(signupChallenge.phone.to)?.formatInternational()
    )
  ) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.AUTHORIZATION_REQUEST_INVALID);
    return;
  }

  const user = await Meiling.Identity.User.findByUsername(username);
  if (user.length > 0) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.EXISTING_USERNAME);
    return;
  }

  const userByEmail = await Meiling.Identity.User.findByUsername(email);
  if (userByEmail.length > 0) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.EXISTING_USERNAME,
      'there is already a user using same email',
    );
    return;
  }

  if (config.meiling.preventDuplicates.email) {
    const emails = await getPrismaClient().email.findMany({
      where: {
        email,
        isPrimary: true,
      },
    });

    if (emails.length > 0) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.EMAIL_NOT_ALLOWED);
      return;
    }
  }

  if (config.meiling.preventDuplicates.phone) {
    const phones = await getPrismaClient().phone.findMany({
      where: {
        phone: phone.formatInternational(),
      },
    });

    if (phones.length > 0) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.PHONE_NOT_ALLOWED);
      return;
    }
  }

  await getPrismaClient().user.create({
    data: {
      username,
      name: name.name,
      familyName: name.familyName,
      middleName: name.middleName,
      givenName: name.givenName,
      emails: {
        create: {
          email,
          verified: true,
          allowUse: true,
          isPrimary: true,
        },
      },
      phones: {
        create: {
          phone: phone.formatInternational(),
          isPrimary: true,
        },
      },
      auths: {
        create: [
          {
            method: 'PASSWORD',
            data: {
              type: 'PASSWORD',
              data: {
                hash: bcrypt.hashSync(password, bcrypt.genSaltSync()),
              },
            },
            allowPasswordReset: false,
            allowSingleFactor: false,
            allowTwoFactor: false,
          },
          {
            method: 'SMS',
            data: {
              type: 'SMS',
            },
            allowPasswordReset: true,
            allowSingleFactor: false,
            allowTwoFactor: true,
          },
        ],
      },
    },
  });

  await Meiling.V1.Session.setAuthenticationStatus(req, undefined);

  rep.send({
    success: true,
  });
}
