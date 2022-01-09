import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getPrismaClient } from '../../../../resources/prisma';
import { sendMeilingError } from '../../../../common/meiling/v1/error/error';
import libPhoneNumberJs from 'libphonenumber-js';
import { Meiling } from '../../../../common';

interface UserPhoneRegisterInterface {
  phone?: string;
  isVerified?: boolean | string;
  isPrimary?: boolean | string;
}

const userPhonesAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
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
    const body = req.body as UserPhoneRegisterInterface | undefined;

    if (!body?.phone || typeof body.phone !== 'string') {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
      return;
    }

    if (typeof body.isVerified === 'string') {
      body.isVerified = /^true$/gi.test(body.isVerified);
    }

    if (typeof body.isPrimary === 'string') {
      body.isPrimary = /^true$/gi.test(body.isPrimary);
    }

    const phone = libPhoneNumberJs(body.phone);

    if (!phone) {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid phone number');
      return;
    }

    const matchingPhones = (
      await getPrismaClient().phone.findMany({
        where: {
          userId: uuid,
        },
      })
    ).filter((n) => n.phone === phone.formatInternational());

    if (matchingPhones.length > 0) {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.CONFLICT, 'phone number already exists');
      return;
    }

    if (body.isPrimary) {
      // check if there is existing primary phones.
      const primaryPhones = await getPrismaClient().phone.findMany({
        where: {
          isPrimary: true,
        },
      });

      const myPrimaryPhones = primaryPhones.filter((n) => n.userId === uuid);
      const othersPrimaryPhones = primaryPhones.filter((n) => n.userId !== uuid && n.isPrimary);

      if (othersPrimaryPhones.length > 0) {
        sendMeilingError(
          rep,
          Meiling.V1.Error.ErrorType.CONFLICT,
          'there is other user who is using this phone as primary phone',
        );
        return;
      }

      for (const primaryPhone of myPrimaryPhones) {
        await getPrismaClient().phone.update({
          where: {
            id: primaryPhone.id,
          },
          data: {
            isPrimary: false,
          },
        });
      }
    }

    const phoneModel = await getPrismaClient().phone.create({
      data: {
        user: {
          connect: {
            id: uuid,
          },
        },
        phone: phone.formatInternational(),
        isPrimary: body.isPrimary || false,
      },
    });

    rep.send(phoneModel);
  });

  app.register(userPhoneAdminHandler, { prefix: '/:phoneId' });

  done();
};

const userPhoneAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
  app.get('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;
    const phoneId = (req.params as { phoneId: string }).phoneId;

    const phone = await getPrismaClient().phone.findFirst({
      where: {
        user: {
          id: uuid,
        },
        id: phoneId,
      },
    });

    if (phone === null) {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
      return;
    }

    rep.send(phone);
  });

  app.put('/', async (req, rep) => {
    const uuid = (req.params as { uuid: string }).uuid;
    const phoneId = (req.params as { phoneId: string }).phoneId;
    const body = req.body as {
      phone?: string;
      isPrimary?: boolean;
    };

    const phone = await getPrismaClient().phone.findFirst({
      where: {
        user: {
          id: uuid,
        },
        id: phoneId,
      },
    });

    if (phone === null) {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
      return;
    }

    let phoneNumber: string | undefined = undefined;

    if (typeof body.phone === 'string') {
      const phoneNumberObj = libPhoneNumberJs(body.phone);
      if (!phoneNumberObj) {
        sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid phone number');
        return;
      }

      phoneNumber = phoneNumberObj.formatInternational();
    }

    if (body.isPrimary) {
      // check if there is existing primary phones.
      const primaryPhones = await getPrismaClient().phone.findMany({
        where: {
          isPrimary: true,
        },
      });

      const myPrimaryPhones = primaryPhones.filter((n) => n.userId === uuid);
      const othersPrimaryPhones = primaryPhones.filter((n) => n.userId !== uuid && n.isPrimary);

      if (othersPrimaryPhones.length > 0) {
        sendMeilingError(
          rep,
          Meiling.V1.Error.ErrorType.CONFLICT,
          'there is other user who is using this phone as primary phone',
        );
        return;
      }

      for (const primaryPhone of myPrimaryPhones) {
        await getPrismaClient().phone.update({
          where: {
            id: primaryPhone.id,
          },
          data: {
            isPrimary: false,
          },
        });
      }
    }

    await getPrismaClient().phone.update({
      where: {
        id: phoneId,
      },
      data: {
        phone: phoneNumber,
        isPrimary: typeof body.isPrimary === 'boolean' ? body.isPrimary : undefined,
      },
    });

    app.delete('/', async (req, rep) => {
      const phoneId = (req.params as { phoneId: string }).phoneId;

      const phone = await getPrismaClient().phone.findFirst({
        where: {
          user: {
            id: uuid,
          },
          id: phoneId,
        },
      });

      if (phone === null) {
        sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);
        return;
      }

      if (phone.isPrimary) {
        sendMeilingError(
          rep,
          Meiling.V1.Error.ErrorType.CONFLICT,
          'you should assign new primary number before deleting it',
        );
        return;
      }

      await getPrismaClient().phone.delete({
        where: {
          id: phoneId,
        },
      });
    });
  });

  done();
};

export default userPhonesAdminHandler;
