import Dexie, { Table } from 'dexie';
import type { StudentProfile, Semester, Course, AttendanceRecord, AcademicEvent } from './models';

export class StudentDatabase extends Dexie {
  profile!: Table<StudentProfile, string>;
  semesters!: Table<Semester, string>;
  courses!: Table<Course, string>;
  attendance!: Table<AttendanceRecord, string>;
  events!: Table<AcademicEvent, string>;

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
      courses: 'id, semesterId' // Index semesterId for fast relational queries
    });
  }
}

export const db = new StudentDatabase();
