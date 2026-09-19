export interface StudentProfile {
  id: string; // Will typically be 'me' as it's a single-user app
  universityName?: string;
  department?: string;
  maxGradingScale: number; // e.g., 4.0 or 5.0
  targetCGPA?: number;
  currentCGPA?: number;
  totalCredits?: number;
  totalDegreeCredits?: number; // Total credits required to graduate
  activeSemesterId?: string; // Pointer to current active semester
  targetAttendancePercentage?: number;
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

export interface RoutineSlot {
  id: string;
  courseId: string; // Relational link to Course
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "HH:mm" 24-hour format (e.g., "09:30")
  endTime: string; // "HH:mm" 24-hour format (e.g., "11:00")
  roomNumber?: string;
  type?: string; // "Lecture", "Lab", "Tutorial"
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceLog {
  id: string;
  courseId: string; // Relational link to Course
  date: string; // "YYYY-MM-DD" local date string
  status: 'present' | 'absent' | 'late' | 'excused';
  createdAt: string;
  updatedAt: string;
}

export interface AcademicEvent {
  id: string; // UUID
  courseId?: string; // Relational link to Course (optional)
  title: string;
  date: number; // Unix timestamp
  type: 'exam' | 'assignment' | 'other';
  isCompleted: boolean;
  checklist?: { id: string; title: string; isCompleted: boolean }[];
  createdAt: number;
}

export interface StudentDocument {
  id: string;
  courseId?: string; // Relational link to Course
  semesterId?: string; // Relational link to Semester
  title: string; 
  imageData?: string; // Legacy support
  fileData?: string; // Legacy Base64 string of the file
  fileUri?: string; // Capacitor Filesystem native path
  mimeType?: string; // e.g., "application/pdf", "image/jpeg"
  size?: number; // bytes
  createdAt: string;
}
