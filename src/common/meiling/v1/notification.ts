import { Notification } from '../../';
import { ExtendedAuthMethods } from './interfaces';

export function convertToNotificationMethod(method: ExtendedAuthMethods): Notification.NotificationMethod | undefined {
  switch (method) {
    case ExtendedAuthMethods.EMAIL:
      return Notification.NotificationMethod.EMAIL;
    case ExtendedAuthMethods.SMS:
      return Notification.NotificationMethod.SMS;
    default:
      return undefined;
  }

  return undefined;
}
