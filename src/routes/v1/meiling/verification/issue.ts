import { MeilingV1Verification } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '..';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';

export async function meilingV1VerificationHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const body = req.body as MeilingV1Verification;

  sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
}
