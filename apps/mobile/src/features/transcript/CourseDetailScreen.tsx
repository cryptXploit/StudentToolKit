import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { calculateAttendancePercentage, calculateDaysRemaining, calculateAttendanceStatus, calculateSemesterGPA, calculateCumulativeCGPA } from '@student-os/engine';
import { Card, Input, Button, Label } from '@student-os/ui';
import { ArrowLeft, Trash2, Plus, Clock, MapPin, AlertCircle, CheckCircle, XCircle, Folder, ChevronRight } from 'lucide-react';
import { hapticImpact } from '../../lib/haptics';
import { generateSafeId } from '../../lib/id';
import { scheduleRoutineReminder, cancelRoutineReminder } from '../../lib/notifications';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CourseDetailScreen() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const [simAttended, setSimAttended] = useState(0);
  const [simMissed, setSimMissed] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [isSimulatingRetake, setIsSimulatingRetake] = useState(false);
  const [simulatedGrade, setSimulatedGrade] = useState<string>('');

  const profile = useLiveQuery(() => db.profile.get('me'));

  const course = useLiveQuery(async () => {
    try {
      if (!db || !courseId) return null;
      return await db.courses.get(courseId);
    } catch (e) {
      console.error("Dexie Query Failed:", e);
      return null;
    }
  }, [courseId]);

  const routineSlots = useLiveQuery(async () => {
    try {
      if (!db || !courseId) return [];
      return await db.routine.where({ courseId }).toArray();
    } catch (e) {
      console.error("Dexie Query Failed:", e);
      return [];
    }
  }, [courseId]);

  const attendanceLogs = useLiveQuery(async () => {
    try {
      if (!db || !courseId) return [];
      const data = await db.attendance.where({ courseId }).toArray();
      // Sort natively in JS to avoid Dexie index dependencies
      return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      console.error("Dexie Query Failed:", e);
      return [];
    }
  }, [courseId]);

  const docCount = useLiveQuery(async () => {
    try {
      if (!db || !courseId) return 0;
      return await db.documents.where({ courseId }).count();
    } catch (e) {
      console.error("Dexie Query Failed:", e);
      return 0;
    }
  }, [courseId]);

  const courseEvents = useLiveQuery(async () => {
    try {
      if (!db || !courseId) return [];
      const data = await db.events.toArray();
      // Filter in-memory to bypass schema index
      return data
        .filter(e => e.courseId === courseId && !e.isCompleted)
        .sort((a, b) => a.date - b.date);
    } catch (e) {
      console.error("Dexie Query Failed:", e);
      return [];
    }
  }, [courseId]);

  const allCourses = useLiveQuery(async () => {
    if (!db || typeof course?.grade !== 'number') return [];
    return await db.courses.toArray();
  }, [course?.grade]);

  const allSemesters = useLiveQuery(async () => {
    if (!db || typeof course?.grade !== 'number') return [];
    return await db.semesters.toArray();
  }, [course?.grade]);

  const projectedCGPA = useMemo(() => {
    if (!isSimulatingRetake || !allCourses || !allSemesters || !course || !profile) return null;
    const parsedGrade = parseFloat(simulatedGrade);
    if (isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > (profile.maxGradingScale || 4.0)) return null;

    const mockedCourses = allCourses.map(c => c.id === course.id ? { ...c, grade: parsedGrade } : c);

    const semesterRecords = allSemesters.map(semester => {
      const semesterCourses = mockedCourses.filter(c => c.semesterId === semester.id);
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

    return calculateCumulativeCGPA(semesterRecords);
  }, [isSimulatingRetake, allCourses, allSemesters, course, simulatedGrade, profile]);

  const predictiveStats = useMemo(() => {
    if (!attendanceLogs || attendanceLogs.length === 0) return null;
    let attended = 0;
    let total = 0;
    for (const log of attendanceLogs) {
      if (log.status === 'present' || log.status === 'late') {
        attended++;
        total++;
      } else if (log.status === 'absent') {
        total++;
      }
    }
    if (total === 0) return null;
    try {
      const target = profile?.targetAttendancePercentage || 75;
      return calculateAttendanceStatus({ attended, total, targetPercentage: target });
    } catch (e) {
      return null;
    }
  }, [attendanceLogs, profile]);

  const currentPercentage = predictiveStats ? predictiveStats.currentPercentage : calculateAttendancePercentage(attendanceLogs || []);

  const simulatedStats = useMemo(() => {
    if (!attendanceLogs) return null;
    
    // Create mock logs
    const mockLogs: { status: string }[] = [...attendanceLogs];
    for (let i = 0; i < simAttended; i++) mockLogs.push({ status: 'present' });
    for (let i = 0; i < simMissed; i++) mockLogs.push({ status: 'absent' });
    
    let attended = 0;
    let total = 0;
    for (const log of mockLogs) {
      if (log.status === 'present' || log.status === 'late') {
        attended++;
        total++;
      } else if (log.status === 'absent') {
        total++;
      }
    }
    
    if (total === 0) return { currentPercentage: 0, safeMisses: 0, requiredClasses: 0, total: 0 };
    
    try {
      const target = profile?.targetAttendancePercentage || 75;
      const stats = calculateAttendanceStatus({ attended, total, targetPercentage: target });
      return { ...stats, total };
    } catch (e) {
      return null;
    }
  }, [attendanceLogs, profile, simAttended, simMissed]);

  const handleLogAttendance = async (status: 'present' | 'absent' | 'late') => {
    if (!courseId) return;
    
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const existingLog = await db.attendance.where('[courseId+date]').equals([courseId, today]).first();
      
      if (existingLog) {
        await db.attendance.update(existingLog.id, { 
          status, 
          updatedAt: new Date().toISOString() 
        });
      } else {
        const safeId = generateSafeId();
        await db.attendance.put({
          id: safeId,
          courseId,
          date: today,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      hapticImpact('light');
    } catch (error: any) {
      console.error("Failed to log attendance:", error);
      alert("Database Error: " + error.message);
    }
  };

  const sortedSlots = routineSlots ? [...routineSlots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    return a.startTime.localeCompare(b.startTime);
  }) : undefined;

  const handleAddRoutine = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!courseId || !startTime || !endTime) return;

    try {
      const safeId = generateSafeId();
      const newSlot = {
        id: safeId,
        courseId,
        dayOfWeek: parseInt(dayOfWeek, 10),
        startTime,
        endTime,
        roomNumber: roomNumber.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await db.routine.put(newSlot);
      await scheduleRoutineReminder(newSlot, course?.name || 'Your class');

      setRoomNumber('');
      hapticImpact('light');
    } catch (error: any) {
      console.error("Failed to add routine:", error);
      alert("Database Error: " + error.message);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    hapticImpact('medium');
    await cancelRoutineReminder(id);
    await db.routine.delete(id);
  };

  // Helper to format 24h to 12h for rendering
  const formatTime = (time24: string) => {
    const [h, m] = time24.split(':');
    if (!h || !m) return time24;
    const hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${m} ${suffix}`;
  };

  const nearestExam = useMemo(() => {
    if (!courseEvents || courseEvents.length === 0) return null;
    const nextEvent = courseEvents[0];
    if (nextEvent.type === 'exam') return nextEvent;
    return null;
  }, [courseEvents]);

  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  const handleAddChecklist = async (examId: string, currentChecklist: any[]) => {
    if (!newChecklistTitle.trim()) return;
    try {
      const updatedChecklist = [...(currentChecklist || []), {
        id: generateSafeId(),
        title: newChecklistTitle.trim(),
        isCompleted: false
      }];
      await db.events.update(examId, { checklist: updatedChecklist });
      setNewChecklistTitle('');
      hapticImpact('light');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleChecklist = async (examId: string, currentChecklist: any[], itemId: string) => {
    try {
      const updatedChecklist = currentChecklist.map(item => 
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
      );
      await db.events.update(examId, { checklist: updatedChecklist });
      hapticImpact('light');
    } catch (e) {
      console.error(e);
    }
  };

  if (course === undefined) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (course === null) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Course Not Found</h2>
        <Button onClick={() => navigate(-1)} variant="secondary">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2 flex items-center">
        <Button variant="ghost" className="mr-2 p-2 -ml-2 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </Button>
        <div className="truncate">
          <h1 className="text-xl font-bold text-foreground truncate">{course.name || 'Unnamed Course'}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Timetable Builder</p>
        </div>
      </header>

      {typeof course.grade === 'number' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-foreground">Retake Simulator</h3>
              <p className="text-xs text-muted-foreground">Project CGPA impact</p>
            </div>
            <button 
              onClick={() => setIsSimulatingRetake(!isSimulatingRetake)}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full"
            >
              {isSimulatingRetake ? 'Close' : 'Simulate'}
            </button>
          </div>
          
          {isSimulatingRetake && (
            <Card className="p-4 space-y-4 border-2 border-primary/20 bg-primary/5">
              <div>
                <Label>Simulated Target Grade</Label>
                <Input 
                  type="number" step="0.1" min="0" max={profile?.maxGradingScale || 4.0}
                  placeholder={`e.g. ${profile?.maxGradingScale || 4.0}`}
                  value={simulatedGrade}
                  onChange={e => setSimulatedGrade(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {projectedCGPA !== null && profile?.currentCGPA !== undefined && (
                <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                  <div className="text-center flex-1 border-r border-primary/10">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current</p>
                    <p className="text-xl font-bold text-foreground">{profile.currentCGPA.toFixed(2)}</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Projected</p>
                    <p className={`text-xl font-bold ${projectedCGPA > profile.currentCGPA ? 'text-emerald-500' : projectedCGPA < profile.currentCGPA ? 'text-red-500' : 'text-foreground'}`}>
                      {projectedCGPA.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {(() => {
        if (!nearestExam) return null;
        const daysLeft = calculateDaysRemaining(nearestExam.date);
        const checklist = nearestExam.checklist || [];

        return (
          <div className="mb-6">
            <Card className="p-5 border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Exam Mode Active</h2>
                  <h3 className="text-lg font-semibold text-foreground">{nearestExam.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : daysLeft < 0 ? 'Overdue' : `In ${daysLeft} days`} • {new Date(nearestExam.date).toLocaleDateString()}
                  </p>
                </div>
                <AlertCircle className="text-primary opacity-50" size={32} />
              </div>

              <div className="space-y-3 mt-4 pt-4 border-t border-primary/10">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Readiness Checklist</h4>
                
                {checklist.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Add topics to track your exam readiness.</p>
                ) : (
                  <div className="space-y-2">
                    {checklist.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleChecklist(nearestExam.id, checklist, item.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${item.isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-slate-300 dark:border-slate-600'}`}
                        >
                          {item.isCompleted && <CheckCircle size={14} />}
                        </button>
                        <span className={`text-sm flex-1 ${item.isCompleted ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Input 
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="Add syllabus topic..."
                    className="flex-1 h-9 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklist(nearestExam.id, checklist);
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    variant="secondary" 
                    className="h-9 px-3 shrink-0"
                    disabled={!newChecklistTitle.trim()}
                    onClick={() => handleAddChecklist(nearestExam.id, checklist)}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      <form onSubmit={handleAddRoutine}>
        <Card className="p-4 mb-6 space-y-4">
          <div>
            <Label className="text-xs mb-1 text-muted-foreground">Day of Week</Label>
            <select 
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-foreground"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
            >
              {DAYS.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs mb-1 text-muted-foreground">Start Time</Label>
              <Input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs mb-1 text-muted-foreground">End Time</Label>
              <Input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 text-muted-foreground">Room / Location (Optional)</Label>
            <Input 
              placeholder="e.g. Science Building 302" 
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />
          </div>

          <Button 
            type="submit"
            variant="primary" 
            onClick={handleAddRoutine}
            disabled={!startTime || !endTime}
            className="w-full py-3"
          >
            <Plus size={18} className="mr-2" /> Add to Schedule
          </Button>
        </Card>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3 pb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Weekly Schedule</h3>
        
        {sortedSlots === undefined ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
          </div>
        ) : !Array.isArray(sortedSlots) ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading routine...</div>
        ) : sortedSlots.length === 0 ? (
          <div className="text-center p-6 opacity-70 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm text-muted-foreground">No classes scheduled yet. Add your class times above.</p>
          </div>
        ) : (
          sortedSlots.map(slot => (
            <Card key={slot.id} className="flex items-center justify-between p-4">
              <div>
                <h4 className="font-semibold text-foreground text-base mb-1">{DAYS[slot.dayOfWeek]}</h4>
                <div className="flex items-center text-xs text-muted-foreground space-x-3">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                  </div>
                  {slot.roomNumber && (
                    <div className="flex items-center">
                      <MapPin size={12} className="mr-1" />
                      <span className="truncate max-w-[100px]">{slot.roomNumber}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="p-2 text-muted-foreground hover:text-red-500 rounded-lg shrink-0" 
                onClick={() => handleDeleteRoutine(slot.id)}
              >
                <Trash2 size={18} />
              </Button>
            </Card>
          ))
        )}
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-medium text-foreground mb-1">Course Documents</h3>
        <Card 
          className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform" 
          onClick={() => navigate('/tools/vault', { state: { initialSemesterId: course?.semesterId, initialCourseId: course?.id, initialCourseName: course?.name } })}
        >
          <div className="flex items-center">
            <div className="bg-primary/10 p-2.5 rounded-lg mr-3 text-primary">
              <Folder size={20} />
            </div>
            <span className="font-semibold text-foreground">Course Vault</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <span className="text-sm font-medium mr-2">{docCount === undefined ? '...' : `${docCount} file${docCount === 1 ? '' : 's'}`}</span>
            <ChevronRight size={18} className="opacity-50" />
          </div>
        </Card>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 pb-6">
        <h3 className="text-sm font-medium text-foreground mb-1">Upcoming Assessments</h3>
        
        {courseEvents === undefined ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
          </div>
        ) : !Array.isArray(courseEvents) ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading assessments...</div>
        ) : courseEvents.length === 0 ? (
          <div className="text-center p-6 opacity-70 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm text-muted-foreground">No upcoming assessments for this course.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courseEvents.map(event => {
              const daysLeft = calculateDaysRemaining(event.date);
              const isUrgent = daysLeft >= 0 && daysLeft <= 3;
              const isPast = daysLeft < 0;

              return (
                <Card key={event.id} className="p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-foreground text-sm">{event.title}</h4>
                    <span className="text-[10px] uppercase tracking-wider font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {event.type}
                    </span>
                  </div>
                  <div className={`text-xs ${isUrgent ? 'text-red-500 font-bold' : isPast ? 'text-muted-foreground' : 'text-primary font-medium'} flex items-center`}>
                    <Clock size={12} className="mr-1" />
                    <span>
                      {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : daysLeft < 0 ? 'Overdue' : `${daysLeft} days`}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 pb-6">
        <h3 className="text-sm font-medium text-foreground mb-1">Attendance Tracker</h3>
        
        <Card className="p-5 text-center flex flex-col items-center justify-center border-l-4 border-l-primary relative">
          <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest font-medium">Current Percentage</p>
          <div className={`text-4xl font-bold ${!attendanceLogs || attendanceLogs.length === 0 ? 'text-muted-foreground opacity-50' : (currentPercentage < (profile?.targetAttendancePercentage || 75)) ? 'text-red-500' : 'text-emerald-500'}`}>
            {attendanceLogs && attendanceLogs.length > 0 ? `${currentPercentage}%` : '--'}
          </div>
          {predictiveStats && (
            <div className="mt-3 text-sm font-medium">
              {predictiveStats.safeMisses > 0 ? (
                <span className="text-emerald-500">Safe to miss: {predictiveStats.safeMisses}</span>
              ) : predictiveStats.requiredClasses > 0 ? (
                <span className="text-red-500">Must attend next {predictiveStats.requiredClasses}</span>
              ) : (
                <span className="text-muted-foreground">Exactly at threshold</span>
              )}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="secondary" 
            className="flex flex-col items-center py-3 bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50"
            onClick={() => handleLogAttendance('present')}
          >
            <CheckCircle size={20} className="mb-1" />
            <span className="text-[11px] font-medium">Present</span>
          </Button>
          <Button 
            variant="secondary" 
            className="flex flex-col items-center py-3 bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900/50"
            onClick={() => handleLogAttendance('absent')}
          >
            <XCircle size={20} className="mb-1" />
            <span className="text-[11px] font-medium">Absent</span>
          </Button>
          <Button 
            variant="secondary" 
            className="flex flex-col items-center py-3 bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50"
            onClick={() => handleLogAttendance('late')}
          >
            <Clock size={20} className="mb-1" />
            <span className="text-[11px] font-medium">Late</span>
          </Button>
        </div>

        <div className="flex justify-center mt-2">
          <button 
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            {isSimulating ? 'Close Simulator' : 'Run What-If Scenario'}
          </button>
        </div>

        {isSimulating && simulatedStats && (
          <Card className="p-5 mt-2 border-2 border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">What-If Simulator</h4>
                <p className="text-sm text-muted-foreground">Project your future percentage.</p>
              </div>
              <Button 
                variant="ghost" 
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  setSimAttended(0);
                  setSimMissed(0);
                  setIsSimulating(false);
                }}
              >
                Reset
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Future Attended</span>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="secondary" 
                    className="h-8 w-8 p-0 rounded-full"
                    disabled={simAttended <= 0}
                    onClick={() => setSimAttended(Math.max(0, simAttended - 1))}
                  >
                    -
                  </Button>
                  <span className="w-4 text-center font-bold">{simAttended}</span>
                  <Button 
                    variant="secondary" 
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => setSimAttended(simAttended + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Future Missed</span>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="secondary" 
                    className="h-8 w-8 p-0 rounded-full"
                    disabled={simMissed <= 0}
                    onClick={() => setSimMissed(Math.max(0, simMissed - 1))}
                  >
                    -
                  </Button>
                  <span className="w-4 text-center font-bold">{simMissed}</span>
                  <Button 
                    variant="secondary" 
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => setSimMissed(simMissed + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-indigo-500/10 text-center">
              {simulatedStats.total === 0 ? (
                <span className="text-sm text-muted-foreground">No classes logged</span>
              ) : (
                <>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Projected Percentage</p>
                  <div className={`text-3xl font-bold ${simulatedStats.currentPercentage < (profile?.targetAttendancePercentage || 75) ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {simulatedStats.currentPercentage}%
                  </div>
                  <div className="mt-2 text-xs font-medium">
                    {simulatedStats.safeMisses > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Safe to miss {simulatedStats.safeMisses} more</span>
                    ) : simulatedStats.requiredClasses > 0 ? (
                      <span className="text-red-600 dark:text-red-400">Must attend next {simulatedStats.requiredClasses}</span>
                    ) : (
                      <span className="text-muted-foreground">Exactly at threshold</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {!Array.isArray(attendanceLogs) ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading logs...</div>
        ) : attendanceLogs.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Logs</h4>
            {attendanceLogs.slice(0, 5).map(log => (
              <Card key={log.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm text-foreground">{new Date(log.date).toLocaleDateString()}</p>
                  <p className={`text-xs font-semibold uppercase tracking-wider mt-0.5 ${
                    log.status === 'present' ? 'text-emerald-500' :
                    log.status === 'absent' ? 'text-red-500' :
                    'text-orange-500'
                  }`}>
                    {log.status}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  className="p-2 text-muted-foreground hover:text-red-500 rounded-lg shrink-0" 
                  onClick={async () => {
                    hapticImpact('medium');
                    await db.attendance.delete(log.id);
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
