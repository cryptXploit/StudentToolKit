import { db } from '@student-os/storage';
import { deleteFileFromDisk } from './filesystem';
import { cancelRoutineReminder } from './notifications';

/**
 * Safely deletes a Course and eagerly purges all associated
 * routine slots, attendance logs, documents, and physical files.
 * DO NOT wrap in db.transaction() to avoid aborting the IDB transaction
 * during Capacitor native bridge calls.
 */
export async function deleteCourseCascade(courseId: string) {
  // Step 1: Fetch associated documents
  const docs = await db.documents.where({ courseId }).toArray();
  
  // Step 2: Loop through docs and delete physical files via native bridge
  for (const doc of docs) {
    if (doc.fileUri) {
      await deleteFileFromDisk(doc.fileUri);
    }
  }
  
  // Step 3: Delete document rows
  await db.documents.where({ courseId }).delete();
  
  // Step 4: Delete attendance rows
  await db.attendance.where({ courseId }).delete();
  
  // Step 5: Fetch routine slots to cancel alarms, then delete rows
  const slots = await db.routine.where({ courseId }).toArray();
  for (const slot of slots) {
    await cancelRoutineReminder(slot.id);
  }
  await db.routine.where({ courseId }).delete();
  
  // Step 6: Delete the course itself
  await db.courses.delete(courseId);
}

/**
 * Safely deletes a Semester and deeply cascades deletion through
 * all of its associated Courses.
 */
export async function deleteSemesterCascade(semesterId: string) {
  // Fetch all courses for this semester
  const courses = await db.courses.where({ semesterId }).toArray();
  
  // Loop through courses and cascade delete each
  for (const course of courses) {
    await deleteCourseCascade(course.id);
  }
  
  // Delete the semester itself
  await db.semesters.delete(semesterId);
}
