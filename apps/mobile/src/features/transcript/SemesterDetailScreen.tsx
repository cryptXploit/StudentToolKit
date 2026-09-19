import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { calculateSemesterGPA, calculateAttendancePercentage } from '@student-os/engine';
import { Alert, Card, Input, Button } from '@student-os/ui';
import { ArrowLeft, Trash2, Plus, AlertCircle, ChevronRight, Share2 } from 'lucide-react';
import { Share } from '@capacitor/share';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { hapticImpact } from '../../lib/haptics';
import { syncTranscriptToProfile } from '../../lib/sync';
import { deleteCourseCascade } from '../../lib/cascade';

export function SemesterDetailScreen() {
  const { semesterId } = useParams<{ semesterId: string }>();
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState('');
  const [courseCredit, setCourseCredit] = useState('');
  const [courseGrade, setCourseGrade] = useState('');

  const semester = useLiveQuery(async () => {
    try {
      if (!db || !semesterId) return null;
      return await db.semesters.get(semesterId);
    } catch (e) {
      console.error("Dexie Query Failed:", e);
      return null;
    }
  }, [semesterId]);

  const courses = useLiveQuery(async () => {
    try {
      if (!db || !semesterId) return [];
      return await db.courses.where({ semesterId }).toArray();
    } catch (e) {
      console.error("Dexie Query Failed:", e);
      return [];
    }
  }, [semesterId]);

  const handleAddCourse = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!semesterId) return;

    const parsedCredit = parseFloat(courseCredit);
    const parsedGrade = courseGrade ? parseFloat(courseGrade) : undefined;

    if (isNaN(parsedCredit) || parsedCredit <= 0) return;

    try {
      const safeId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2);
      await db.courses.put({
        id: safeId,
        semesterId,
        name: courseName.trim(),
        credit: parsedCredit,
        grade: parsedGrade,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setCourseName('');
      setCourseCredit('');
      setCourseGrade('');
      await syncTranscriptToProfile();
      hapticImpact('light');
    } catch (error: any) {
      console.error("Failed to add course:", error);
      alert("Database Error: " + error.message);
    }
  };

  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  const confirmDeleteCourse = async () => {
    if (!itemToDelete) return;
    hapticImpact('medium');
    await deleteCourseCascade(itemToDelete.id);
    await syncTranscriptToProfile();
    setItemToDelete(null);
  };

  const semesterStats = useMemo(() => {
    if (!courses) return { gpa: 0, totalCredits: 0 };
    const validCourses = courses.filter(c => typeof c.grade === 'number' && c.grade >= 0 && c.credit > 0);
    const engineRecords = validCourses.map(c => ({
      credits: c.credit,
      gradePoint: c.grade as number
    }));

    try {
      const gpa = calculateSemesterGPA(engineRecords);
      const totalCredits = validCourses.reduce((sum, c) => sum + c.credit, 0);
      return { gpa, totalCredits };
    } catch (e) {
      return { gpa: 0, totalCredits: 0 };
    }
  }, [courses]);

  const attendanceLogs = useLiveQuery(async () => {
    try {
      if (!db || !courses || courses.length === 0) return [];
      const courseIds = courses.map(c => c.id);
      
      const allLogs = await db.attendance.toArray();
      return allLogs.filter(log => courseIds.includes(log.courseId));
    } catch (e) {
      console.error("Dexie Query Failed:", e);
      return [];
    }
  }, [courses]);

  const averageAttendance = useMemo(() => {
    if (!attendanceLogs || attendanceLogs.length === 0) return null;
    return calculateAttendancePercentage(attendanceLogs);
  }, [attendanceLogs]);

  const handleShareSnapshot = async () => {
    if (!semester) return;
    
    hapticImpact('light');
    
    const attString = averageAttendance !== null ? `${averageAttendance}%` : 'N/A';
    const snapshotText = `?? Semester Snapshot: ${semester.name}\n? GPA: ${semesterStats.gpa.toFixed(2)}\n?? Credits: ${semesterStats.totalCredits}\n? Attendance: ${attString}\n\nTracked with Student OS`;
    
    try {
      await Share.share({
        title: 'My Semester',
        text: snapshotText,
        dialogTitle: 'Share Semester Snapshot',
      });
    } catch (error) {
      console.error('Error sharing snapshot:', error);
    }
  };

  if (semester === undefined) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (semester === null) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Semester Not Found</h2>
        <Button onClick={() => navigate(-1)} variant="secondary">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2 flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <Button variant="ghost" className="mr-2 p-2 -ml-2 shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold text-foreground truncate pr-2">{semester.name}</h1>
        </div>
        <Button variant="ghost" className="p-2 -mr-2 text-primary" onClick={handleShareSnapshot}>
          <Share2 size={22} />
        </Button>
      </header>

      <Alert variant="info" className="mb-6">
        <div className="flex justify-between items-center w-full mb-3">
          <div>
            <p className="text-sm font-medium opacity-80">Semester GPA</p>
            <p className="text-3xl font-bold">{semesterStats.gpa.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium opacity-80">Graded Credits</p>
            <p className="text-xl font-semibold">{semesterStats.totalCredits}</p>
          </div>
        </div>
        <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
          <span className="text-sm font-medium opacity-80">Average Attendance</span>
          <span className="text-sm font-bold bg-primary/20 px-2 py-0.5 rounded">
            {averageAttendance !== null ? `${averageAttendance}%` : 'N/A'}
          </span>
        </div>
      </Alert>

      <form onSubmit={handleAddCourse}>
        <Card className="p-4 mb-6 space-y-3">
          <Input 
            placeholder="Course Name (e.g., Intro to CS)" 
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
          <div className="flex gap-2">
            <Input 
              placeholder="Credits" 
              type="number"
              step="0.5"
              min="0"
              value={courseCredit}
              onChange={(e) => setCourseCredit(e.target.value)}
              className="flex-1"
            />
            <Input 
              placeholder="Grade (e.g. 4.0)" 
              type="number"
              step="0.1"
              min="0"
              value={courseGrade}
              onChange={(e) => setCourseGrade(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="submit"
              variant="primary" 
              onClick={handleAddCourse}
              disabled={!courseCredit || isNaN(parseFloat(courseCredit)) || parseFloat(courseCredit) <= 0}
              className="px-4 shrink-0"
            >
              <Plus size={20} />
            </Button>
          </div>
        </Card>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3 pb-6">
        {courses === undefined || !Array.isArray(courses) ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center p-6 opacity-70">
            <p className="text-sm text-muted-foreground">No courses added yet. Add your first course above.</p>
          </div>
        ) : (
          courses.map(course => (
            <Card key={course.id} className="flex items-center justify-between p-1 overflow-hidden group">
              <Link to={`/course/${course.id}`} className="flex-1 p-3 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors rounded-lg">
                <div>
                  <h3 className="font-semibold text-foreground">{course.name || 'Unnamed Course'}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {course.credit} Credits
                    {typeof course.grade === 'number' && ` • Grade: ${course.grade}`}
                  </p>
                </div>
                <ChevronRight size={20} className="text-muted-foreground opacity-50" />
              </Link>
              <Button 
                variant="ghost" 
                className="p-3 text-muted-foreground hover:text-red-500 rounded-lg shrink-0" 
                onClick={(e) => {
                  e.preventDefault();
                  setItemToDelete({ id: course.id, name: course.name });
                }}
              >
                <Trash2 size={20} />
              </Button>
            </Card>
          ))
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={itemToDelete !== null}
        itemName={itemToDelete?.name || ''}
        onConfirm={confirmDeleteCourse}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
