import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { FastifyRequestWithSession } from '.';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';

interface MeilingV1Signup {
  username: string;
  phone: string;
  email: string;
  password: string;
}

export async function meilingV1SignupHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;

  const body = req.body as MeilingV1Signup;

  sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
}
