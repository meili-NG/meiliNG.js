import chalk from 'chalk';
import { FastifyReply } from 'fastify/types/reply';
import { NodeEnvironment } from '../../../../interface';
import config from '../../../../resources/config';
import { ErrorResponse } from './interface';
import { ErrorType } from './type';
import { Error as CommonError } from '../..';

function getMeilingErrorStatusCode(type: ErrorType) {
  switch (type) {
    case ErrorType.TWO_FACTOR_AUTHENTICATION_REQUIRED:
      // it is draft, but lets try it anyway.
      // https://github.com/bretterer/HTTP-250-2FA-Required/blob/master/draft.adoc#why-250
      // return 250;

      // but for compatibility: here is 401.
      return 401;

    case ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED:
    case ErrorType.AUTHENTICATION_NOT_CURRENT_CHALLENGE_METHOD:
    case ErrorType.TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED:
    case ErrorType.INVALID_REQUEST:
    case ErrorType.INVALID_TOKEN:
    case ErrorType.INVALID_SIGNIN_METHOD:
    case ErrorType.INVALID_SIGNIN_TYPE:
    case ErrorType.ALREADY_SIGNED_IN:
    case ErrorType.ALREADY_SIGNED_OUT:
    case ErrorType.APPLICATION_REDIRECT_URI_INVALID:
    case ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED:
    case ErrorType.AUTHENTICATION_REQUEST_NOT_COMPLETED:
      return 400;

    case ErrorType.UNAUTHORIZED:
    case ErrorType.WRONG_USERNAME:
    case ErrorType.WRONG_PASSWORD:
    case ErrorType.SIGNIN_FAILED:
    case ErrorType.INVALID_SESSION:
    case ErrorType.APPLICATION_NOT_AUTHORIZED_BY_USER:
    case ErrorType.APPLICATION_NOT_AUTHORIZED_SCOPES:
    case ErrorType.AUTHENTICATION_REQUEST_INVALID:
      return 401;

    case ErrorType.FORBIDDEN:
      return 403;

    case ErrorType.APPLICATION_NOT_FOUND:
    case ErrorType.NOT_FOUND:
      return 404;

    case ErrorType.UNSUPPORTED_SIGNIN_METHOD:
    case ErrorType.UNSUPPORTED_SCOPE:
    case ErrorType.UNSUPPORTED_RESPONSE_TYPE:
    case ErrorType.UNSUPPORTED_AUTHENTICATION_TYPE:
      return 405;

    case ErrorType.MORE_THAN_ONE_USER_MATCHED:
    case ErrorType.APPLICATION_USER_ACTION_REQUIRED:
    case ErrorType.EXISTING_USERNAME:
    case ErrorType.EXISTING_PASSWORD:
    case ErrorType.EMAIL_NOT_ALLOWED:
    case ErrorType.PHONE_NOT_ALLOWED:
    case ErrorType.CONFLICT:
      return 409;

    case ErrorType.AUTHENTICATION_TIMEOUT:
      return 410;

    case ErrorType.AUTHENTICATION_REQUEST_RATE_LIMITED:
      return 429;

    case ErrorType.INTERNAL_SERVER_ERROR:
      return 500;

    case ErrorType.NOT_IMPLEMENTED:
      return 501;
  }

  // the function for checking all cases are handled.
  // eslint-disable-next-line
  ((n: never) => { })(type);
}

// TODO: implement throws
export class MeilingError extends Error {
  public _isMeiling: true = true;

  public type: ErrorType;
  public description?: string;
  public details?: any;
  public debug?: any;

  constructor(type: ErrorType, description?: string, details?: any, debug?: any) {
    super(description);
    this.type = type;
    this.name = 'meiliNG Error';
    this.message = description ? description : type;
    this.description = description;
    this.details = details;
    this.debug = debug;
  }

  public toString() {
    return this.description;
  }

  public static load(error: MeilingError) {
    const mlError = new MeilingError(error.type, error.description, error.details, error.debug);
    console.log(mlError);

    return mlError;
  }

  public loadError(error: Error) {
    this.name = error.name;
    this.message = error.message;
    this.description = error.message;
    this.stack = error.stack;
  }

  public serialize(): ErrorResponse {
    let base: ErrorResponse = {
      type: this.type,
      description: this.description,
      details: this.details,
    };

    if (config.node.environment === NodeEnvironment.Development) {
      base = {
        ...base,
        debug: this.debug,
        stack: this.stack,
      };
    }

    return base;
  }

  public getStatusCode() {
    const type = this.type;
    return getMeilingErrorStatusCode(type);
  }

  public sendFastify(rep: FastifyReply) {
    rep.status(this.getStatusCode()).send(this.serialize());
  }
}
