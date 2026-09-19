import { db } from '@student-os/storage';
import { calculateSemesterGPA, calculateCumulativeCGPA } from '@student-os/engine';

export async function syncTranscriptToProfile() {
  const semesters = await db.semesters.toArray();
  const allCourses = await db.courses.toArray();

  const semesterRecords = semesters.map(semester => {
    const semesterCourses = allCourses.filter(c => c.semesterId === semester.id);
    const validCourses = semesterCourses.filter(c => typeof c.grade === 'number' && c.grade >= 0 && c.credit > 0);
    const courseRecords = validCourses.map(c => ({
      credits: c.credit,
      gradePoint: c.grade as number
    }));

    let gpa = 0;
    let totalCredits = 0;
    
    if (courseRecords.length > 0) {
      gpa = calculateSemesterGPA(courseRecords);
      totalCredits = validCourses.reduce((sum, c) => sum + c.credit, 0);
    }
    
    return { credit: totalCredits, gpa };
  }).filter(record => record.credit > 0);

  let grandCGPA = 0;
  let grandCredits = 0;

  if (semesterRecords.length > 0) {
    grandCGPA = calculateCumulativeCGPA(semesterRecords);
    grandCredits = semesterRecords.reduce((sum, s) => sum + s.credit, 0);
  }

  const profile = await db.profile.get('me');

  await db.profile.put({
    ...(profile || { maxGradingScale: 4.0, updatedAt: Date.now() }),
    id: 'me',
    currentCGPA: grandCGPA > 0 ? grandCGPA : undefined,
    totalCredits: grandCredits > 0 ? grandCredits : undefined,
    updatedAt: Date.now()
  });
}
