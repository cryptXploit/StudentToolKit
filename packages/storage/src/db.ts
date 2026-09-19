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
    super('StudentUtilityOSDB');
    
    // V1 Schema
    this.version(1).stores({
      profile: 'id',
      semesters: 'id, isCurrent',
      courses: 'id, semesterId, code',
      attendance: 'id, courseId'
    });

    // V2 Schema - Safe non-destructive upgrade adding events table
    this.version(2).stores({
      profile: 'id',
      semesters: 'id, isCurrent',
      courses: 'id, semesterId, code',
      attendance: 'id, courseId',
      events: 'id, type, date, isCompleted'
    });

    // V3 Schema - Transcript Schema
    this.version(3).stores({
      profile: 'id',
      events: 'id, date, isCompleted',
      semesters: 'id',
      courses: 'id, semesterId', // Index semesterId for fast relational queries
      attendance: 'id, courseId' // Must keep attendance here so it is not dropped during V2->V3 migration!
    });

    // V4 Schema - Routine and Attendance Schema
    this.version(4).stores({
      profile: 'id',
      events: 'id, date, isCompleted',
      semesters: 'id',
      courses: 'id, semesterId',
      routine: 'id, courseId, dayOfWeek', // Index courseId and dayOfWeek for fast daily queries
      attendance: 'id, courseId, date, [courseId+date]' // Compound index for fast checking if a class was logged today
    });

    // V5 Schema - Document Vault
    this.version(5).stores({
      profile: 'id',
      events: 'id, date, isCompleted',
      semesters: 'id',
      courses: 'id, semesterId',
      routine: 'id, courseId, dayOfWeek',
      attendance: 'id, courseId, date, [courseId+date]',
      documents: 'id, createdAt' // Sortable by date added
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
