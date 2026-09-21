import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications are only available on native devices.');
    return false;
  }

  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return true;
    if (display === 'denied') return false;
    
    if (display === 'prompt' || display === 'prompt-with-rationale') {
      const { display: newStatus } = await LocalNotifications.requestPermissions();
      return newStatus === 'granted';
    }
    
    return false;
  } catch (e) {
    console.warn('Failed to check or request notification permissions', e);
    return false;
  }
}

export async function scheduleEventReminder(eventId: string, title: string, eventDateMs: number, type: string) {
  if (!Capacitor.isNativePlatform()) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.warn('Notifications permission denied. Aborting reminder schedule.');
    return;
  }

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

export async function scheduleRoutineReminder(slot: any, courseName: string) {
  if (!Capacitor.isNativePlatform()) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.warn('Notifications permission denied. Aborting reminder schedule.');
    return;
  }

  try {
    const [hoursStr, minutesStr] = slot.startTime.split(':');
    const d = new Date();
    d.setHours(parseInt(hoursStr, 10), parseInt(minutesStr, 10), 0, 0);
    d.setMinutes(d.getMinutes() - 15);
    
    const triggerHour = d.getHours();
    const triggerMinute = d.getMinutes();
    const triggerWeekday = slot.dayOfWeek + 1;

    let numericId = 0;
    for (let i = 0; i < slot.id.length; i++) {
      numericId = (numericId << 5) - numericId + slot.id.charCodeAt(i);
      numericId |= 0;
    }
    numericId = Math.abs(numericId);

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Class in 15 mins",
          body: `${courseName} is starting. Room: ${slot.roomNumber || 'TBA'}`,
          id: numericId,
          schedule: { on: { weekday: triggerWeekday, hour: triggerHour, minute: triggerMinute } },
          extra: { slotId: slot.id }
        }
      ]
    });
  } catch (e) {
    console.error('Failed to schedule routine reminder', e);
  }
}

export async function cancelRoutineReminder(slotId: string) {
  if (!Capacitor.isNativePlatform()) return;

  let numericId = 0;
  for (let i = 0; i < slotId.length; i++) {
    numericId = (numericId << 5) - numericId + slotId.charCodeAt(i);
    numericId |= 0;
  }
  numericId = Math.abs(numericId);

  try {
    await LocalNotifications.cancel({ notifications: [{ id: numericId }] });
  } catch (e) {
    console.error('Failed to cancel routine reminder', e);
  }
}
