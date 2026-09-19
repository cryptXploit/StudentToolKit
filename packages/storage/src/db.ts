import Dexie, { Table } from 'dexie';
import type { StudentProfile, Semester, Course, RoutineSlot, AttendanceLog, AcademicEvent, StudentDocument } from './models';

export class StudentDatabase extends Dexie {
  profile!: Table<StudentProfile, string>;
  semesters!: Table<Semester, string>;
  courses!: Table<Course, string>;
  routine!: Table<RoutineSlot, string>;
  attendance!: Table<AttendanceLog, string>;
  events!: Table<AcademicEvent, string>;
  documents!: Table<StudentDocument, string>;

  constructor() {
    super('PrepiaDB_Clean');
    
    this.version(1).stores({
      profile: 'id',
      events: 'id, date, isCompleted',
      semesters: 'id',
      courses: 'id, semesterId',
      routine: 'id, courseId, dayOfWeek',
      attendance: 'id, courseId, date, [courseId+date]',
      documents: 'id, createdAt'
    });

    this.profile = this.table('profile');
    this.semesters = this.table('semesters');
    this.courses = this.table('courses');
    this.routine = this.table('routine');
    this.attendance = this.table('attendance');
    this.events = this.table('events');
    this.documents = this.table('documents');
  }
}

export const db = new StudentDatabase();

db.open().catch(err => {
  console.error("Dexie failed to open:", err);
  alert("CRITICAL DB ERROR: " + err.message);
});
