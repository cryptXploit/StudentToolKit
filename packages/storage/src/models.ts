export interface StudentProfile {
  id: string; // Will typically be 'me' as it's a single-user app
  universityName?: string;
  department?: string;
  maxGradingScale: number; // e.g., 4.0 or 5.0
  targetCGPA?: number;
  currentCGPA?: number;
  totalCredits?: number;
  updatedAt: number;
}

export interface Semester {
  id: string;
  name: string; // e.g., "Fall 2026"
  term?: string;
  year?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  semesterId: string; // Relational link to Semester
  code?: string; // e.g., "CSE 101"
  name: string; // e.g., "Intro to Programming"
  credit: number;
  grade?: number; // Numeric grade (e.g., 4.0, 3.7)
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string; // UUID
  courseId: string; // Foreign key to Course
  attendedClasses: number;
  totalClasses: number;
  targetPercentage: number;
  updatedAt: number;
}

export interface AcademicEvent {
  id: string; // UUID
  title: string;
  date: number; // Unix timestamp
  type: 'exam' | 'assignment' | 'other';
  isCompleted: boolean;
  createdAt: number;
}
