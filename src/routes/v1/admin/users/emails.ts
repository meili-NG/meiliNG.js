import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getPrismaClient } from '../../../../resources/prisma';
import { sendMeilingError } from '../../meiling/error';
import { MeilingV1ErrorType } from '../../meiling/interfaces';

interface UserEmailRegisterInterface {
  email?: string;
  isVerified?: boolean | string;
  isPrimary?: boolean | string;
}

const userEmailsAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
  app.get('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;

    const emails = await getPrismaClient().email.findMany({
      where: {
        user: {
          id: uuid,
        },
      },
    });

    rep.send(emails);
  });

  app.post('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;
    const body = req.body as UserEmailRegisterInterface | undefined;

    if (!body?.email) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
      return;
    }

    if (typeof body.isVerified === 'string') {
      body.isVerified = /^true$/gi.test(body.isVerified);
    }

    if (typeof body.isPrimary === 'string') {
      body.isPrimary = /^true$/gi.test(body.isPrimary);
    }

    if (body.isPrimary) {
      // check if there is existing primary emails.
      const primaryEmails = await getPrismaClient().email.findMany({
        where: {
          user: {
            id: uuid,
          },
          isPrimary: true,
        },
      });

      for (const primaryEmail of primaryEmails) {
        await getPrismaClient().email.update({
          where: {
            id: primaryEmail.id,
          },
          data: {
            isPrimary: false,
          },
        });
      }
    }

    const email = await getPrismaClient().email.create({
      data: {
        user: {
          connect: {
            id: uuid,
          },
        },
        email: body.email,
        verified: body.isVerified || false,
        isPrimary: body.isPrimary || false,
      },
    });

    rep.send(email);
  });

  app.register(userEmailAdminHandler, { prefix: '/:emailId' });

  done();
};

const userEmailAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
  app.get('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;
    const emailId = (req.params as { emailId: string }).emailId;

    const email = await getPrismaClient().email.findFirst({
      where: {
        user: {
          id: uuid,
        },
        id: emailId,
      },
    });

    if (email === null) {
      sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND);
      return;
    }

    rep.send(email);
  });

  app.put('/', async (req, rep) => {
    sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
  });

  done();
};

export default userEmailsAdminHandler;
