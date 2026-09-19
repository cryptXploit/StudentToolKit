import { db } from '@student-os/storage';

export async function generateEcosystemBackup() {
  const profile = await db.profile.toArray();
  const events = await db.events.toArray();
  const semesters = await db.semesters.toArray();
  const courses = await db.courses.toArray();
  const routine = await db.routine.toArray();
  const attendance = await db.attendance.toArray();
  const documents = await db.documents.toArray();

  const backupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    data: {
      profile,
      events,
      semesters,
      courses,
      routine,
      attendance,
      documents
    }
  };

  const json = JSON.stringify(backupData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `student-os-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  window.URL.revokeObjectURL(url);
}

export async function restoreEcosystemBackup(jsonString: string) {
  const parsed = JSON.parse(jsonString);
  
  if (!parsed || !parsed.data) {
    throw new Error('Invalid backup file format.');
  }

  // CRITICAL: Atomic transaction across all 7 tables
  await db.transaction(
    'rw', 
    [db.profile, db.events, db.semesters, db.courses, db.routine, db.attendance, db.documents], 
    async () => {
      // Clear existing data
      await db.profile.clear();
      await db.events.clear();
      await db.semesters.clear();
      await db.courses.clear();
      await db.routine.clear();
      await db.attendance.clear();
      await db.documents.clear();
      
      // Bulk add new data safely
      if (parsed.data.profile?.length) await db.profile.bulkAdd(parsed.data.profile);
      if (parsed.data.events?.length) await db.events.bulkAdd(parsed.data.events);
      if (parsed.data.semesters?.length) await db.semesters.bulkAdd(parsed.data.semesters);
      if (parsed.data.courses?.length) await db.courses.bulkAdd(parsed.data.courses);
      if (parsed.data.routine?.length) await db.routine.bulkAdd(parsed.data.routine);
      if (parsed.data.attendance?.length) await db.attendance.bulkAdd(parsed.data.attendance);
      if (parsed.data.documents?.length) await db.documents.bulkAdd(parsed.data.documents);
    }
  );
}
