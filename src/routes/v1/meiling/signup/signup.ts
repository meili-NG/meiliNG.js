import { FastifyReply, FastifyRequest } from 'fastify';
import libmobilephoneJs from 'libphonenumber-js';
import { FastifyRequestWithSession } from '..';
import { Utils } from '../../../../common';
import { getAuthorizationStatus } from '../common/session';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';

interface MeilingV1Signup {
  username: string;
  phone: string;
  email: string;
  password: string;
  name: Utils.MeilingV1SignupName;
}

export async function meilingV1SignupHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const body = req.body as MeilingV1Signup;

  if (!Utils.isValidValue(body.username, body.email, body.phone, body.password)) {
    // you are out.
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'Invalid body');
    return;
  }

  if (!Utils.isValidName(body.name)) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'Invalid Name');
    return;
  }

  const signupChallenge = await getAuthorizationStatus(req);

  if (signupChallenge === undefined) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.AUTHORIZATION_REQUEST_NOT_GENERATED,
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
    sendMeilingError(
      rep,
      MeilingV1ErrorType.INVALID_REQUEST,
      'Username should be consisting alphanumeric characters and _, -, .',
    );
    return;
  }

  if (!Utils.isValidPassword(password)) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'password should contain at least 8 characters.');
    return;
  }

  if (!phone) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.INVALID_REQUEST,
      'Phone number should be valid ITU compliant international number',
    );
    return;
  }

  if (!Utils.isValidEmail(email)) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'Entered email is NOT a valid email.');
    return;
  }

  // check with validation.

  if (!(signupChallenge.email && signupChallenge.phone)) {
    sendMeilingError(rep, MeilingV1ErrorType.AUTHORIZATION_REQUEST_NOT_COMPLETED);
    return;
  }

  if (
    !(
      signupChallenge.email.to === email &&
      phone &&
      phone.formatInternational() === libmobilephoneJs(signupChallenge.phone.to)?.formatInternational()
    )
  ) {
    sendMeilingError(rep, MeilingV1ErrorType.AUTHORIZATION_REQUEST_INVALID);
    return;
  }

  sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
}
