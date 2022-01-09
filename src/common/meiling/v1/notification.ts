import { Notification } from '../../';
import { MeilingV1ExtendedAuthMethods } from './interfaces';

export function convertToNotificationMethod(
  method: MeilingV1ExtendedAuthMethods,
): Notification.NotificationMethod | undefined {
  switch (method) {
    case MeilingV1ExtendedAuthMethods.EMAIL:
      return Notification.NotificationMethod.EMAIL;
    case MeilingV1ExtendedAuthMethods.SMS:
      return Notification.NotificationMethod.SMS;
    default:
      return undefined;
  }

  return undefined;
}
