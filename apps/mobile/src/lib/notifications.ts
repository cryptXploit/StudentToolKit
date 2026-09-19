import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications are only available on native devices.');
    return false;
  }

  const { display } = await LocalNotifications.checkPermissions();
  if (display !== 'granted') {
    const { display: newStatus } = await LocalNotifications.requestPermissions();
    return newStatus === 'granted';
  }
  return true;
}

export async function scheduleEventReminder(eventId: string, title: string, eventDateMs: number, type: string) {
  if (!Capacitor.isNativePlatform()) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Schedule for 9 AM the day before the event
  const scheduleDate = new Date(eventDateMs);
  scheduleDate.setDate(scheduleDate.getDate() - 1);
  scheduleDate.setHours(9, 0, 0, 0);

  // If the scheduled time is already in the past, do not schedule
  if (scheduleDate.getTime() <= Date.now()) {
    return;
  }

  // Capacitor requires a numeric 32-bit ID for notifications. 
  // We hash the UUID string to a number to keep it deterministic but simple for MVP.
  let numericId = 0;
  for (let i = 0; i < eventId.length; i++) {
    numericId = (numericId << 5) - numericId + eventId.charCodeAt(i);
    numericId |= 0; 
  }
  numericId = Math.abs(numericId);

  await LocalNotifications.schedule({
    notifications: [
      {
        title: `Upcoming ${type === 'exam' ? 'Exam' : 'Assignment'}`,
        body: `${title} is scheduled for tomorrow.`,
        id: numericId,
        schedule: { at: scheduleDate },
        extra: { eventId }
      }
    ]
  });
}

export async function cancelEventReminder(eventId: string) {
  if (!Capacitor.isNativePlatform()) return;
  
  let numericId = 0;
  for (let i = 0; i < eventId.length; i++) {
    numericId = (numericId << 5) - numericId + eventId.charCodeAt(i);
    numericId |= 0;
  }
  numericId = Math.abs(numericId);

  try {
    await LocalNotifications.cancel({ notifications: [{ id: numericId }] });
  } catch (e) {
    console.error('Failed to cancel event reminder', e);
  }
}
