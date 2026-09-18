export interface StudentProfile {
  id: string; // Will typically be 'me' as it's a single-user app
  universityName?: string;
  department?: string;
  maxGradingScale: number; // e.g., 4.0 or 5.0
  targetCGPA?: number;
  updatedAt: number;
}

export interface Semester {
  id: string; // e.g., UUID
  name: string; // e.g., 'Fall 2024' or 'Semester 5'
  startDate?: number;
  endDate?: number;
  isCurrent: boolean;
}

export interface Course {
  id: string; // UUID
  semesterId: string; // Foreign key to Semester
  code: string; // e.g., 'ICE 301'
  title?: string;
  credits: number;
  gradePoint?: number; // Null if not completed yet
  targetGradePoint?: number; // Used for "What-If" scenarios
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
