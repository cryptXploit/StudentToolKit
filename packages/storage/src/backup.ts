import { db } from './db';

/**
 * Serializes all IndexedDB tables into a single JSON string.
 */
export async function exportVaultData(): Promise<string> {
  const profile = await db.profile.toArray();
  const events = await db.events.toArray();
  const semesters = await db.semesters.toArray();
  const courses = await db.courses.toArray();
  const attendance = await db.attendance.toArray();

  const backup = {
    version: 1,
    timestamp: Date.now(),
    data: { profile, events, semesters, courses, attendance }
  };

  return JSON.stringify(backup);
}

/**
 * Parses a JSON string and forcefully overrides the local IndexedDB.
 */
export async function importVaultData(jsonString: string): Promise<void> {
  const backup = JSON.parse(jsonString);
  
  if (!backup || !backup.data) {
    throw new Error("Invalid backup file format.");
  }

  const { profile, events, semesters, courses, attendance } = backup.data;

  // Run in a single transaction so if one fails, it rolls back
  await db.transaction('rw', db.profile, db.events, db.semesters, db.courses, db.attendance, async () => {
    await db.profile.clear();
    await db.events.clear();
    await db.semesters.clear();
    await db.courses.clear();
    await db.attendance.clear();

    if (profile?.length) await db.profile.bulkAdd(profile);
    if (events?.length) await db.events.bulkAdd(events);
    if (semesters?.length) await db.semesters.bulkAdd(semesters);
    if (courses?.length) await db.courses.bulkAdd(courses);
    if (attendance?.length) await db.attendance.bulkAdd(attendance);
  });
}
