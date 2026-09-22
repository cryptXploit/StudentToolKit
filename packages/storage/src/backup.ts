import { db } from './db';

export interface BackupData {
  version: number;
  timestamp: number;
  data: {
    profile: any[];
    semesters: any[];
    courses: any[];
    routine: any[];
    attendance: any[];
    events: any[];
  };
}

export async function exportData(): Promise<BackupData> {
  const profile = await db.profile.toArray();
  const semesters = await db.semesters.toArray();
  const courses = await db.courses.toArray();
  const routine = await db.routine.toArray();
  const attendance = await db.attendance.toArray();
  const events = await db.events.toArray();

  return {
    version: 1,
    timestamp: Date.now(),
    data: {
      profile,
      semesters,
      courses,
      routine,
      attendance,
      events
    }
  };
}

export async function importData(jsonData: BackupData): Promise<void> {
  if (!jsonData || !jsonData.data) {
    throw new Error('Invalid backup file format: Missing data block.');
  }

  const { data } = jsonData;
  
  await db.transaction('rw', [db.profile, db.semesters, db.courses, db.routine, db.attendance, db.events], async () => {
    // Clear existing tables
    await db.profile.clear();
    await db.semesters.clear();
    await db.courses.clear();
    await db.routine.clear();
    await db.attendance.clear();
    await db.events.clear();

    // Bulk put new data safely
    if (data.profile && data.profile.length > 0) await db.profile.bulkPut(data.profile);
    if (data.semesters && data.semesters.length > 0) await db.semesters.bulkPut(data.semesters);
    if (data.courses && data.courses.length > 0) await db.courses.bulkPut(data.courses);
    if (data.routine && data.routine.length > 0) await db.routine.bulkPut(data.routine);
    if (data.attendance && data.attendance.length > 0) await db.attendance.bulkPut(data.attendance);
    if (data.events && data.events.length > 0) await db.events.bulkPut(data.events);
  });
}
