import { FastifyReply, FastifyRequest } from 'fastify';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType } from '../interfaces';

export async function meilingV1OAuth2DeviceCodeHandler(req: FastifyRequest, rep: FastifyReply) {
  sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_REQUEST);
}
