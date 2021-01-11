import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { getMeilingV1Session } from './common';
import { sendMeilingError } from './error';
import { MeilingV1Session, MeilingV1ErrorType } from './interfaces';

export async function meilingV1SignupHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = getMeilingV1Session(req);
}
