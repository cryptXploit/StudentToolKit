import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, CheckSquare, Target, GraduationCap, Clock, Calendar, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, Button } from '@student-os/ui';
import { calculateDaysRemaining, calculateAttendanceStatus } from '@student-os/engine';
import { hapticImpact } from '../../lib/haptics';
import { generateSafeId } from '../../lib/id';

function formatTime(time24: string) {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

interface AttentionItem {
  id: string;
  title: string;
  subtitle: string;
  severity: 'critical' | 'warning';
  type: 'attendance' | 'exam' | 'assignment';
}

export function HomeScreen() {
  const navigate = useNavigate();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const today = new Date().toLocaleDateString('en-CA');
  
  const dashboardData = useLiveQuery(async () => {
    const profileContext = await db.profile.get('me');
    const activeSemesterId = profileContext?.activeSemesterId;
    
    let events = await db.events.toArray();
    const allCourses = await db.courses.toArray();
    const allAttendance = await db.attendance.toArray();
    
    let activeCourses = allCourses;
    if (activeSemesterId) {
      activeCourses = allCourses.filter(c => c.semesterId === activeSemesterId);
      events = events.filter(e => !e.courseId || activeCourses.some(c => c.id === e.courseId));
    }
    
    const attentionItems: AttentionItem[] = [];
    
    // Rule 1: Attendance Risk
    const targetPercentage = profileContext?.targetAttendancePercentage || 75;
    for (const course of activeCourses) {
      const courseLogs = allAttendance.filter(l => l.courseId === course.id);
      let attended = 0;
      let total = 0;
      for (const log of courseLogs) {
        if (log.status === 'present' || log.status === 'late') { attended++; total++; }
        else if (log.status === 'absent') { total++; }
      }
      if (total > 0) {
        try {
          const stats = calculateAttendanceStatus({ attended, total, targetPercentage });
          if (stats.requiredClasses > 0) {
            attentionItems.push({
              id: `att-${course.id}`,
              title: `Attendance Risk: ${course.name}`,
              subtitle: `Current: ${stats.currentPercentage}%. Need to attend next ${stats.requiredClasses} ${stats.requiredClasses === 1 ? 'class' : 'classes'}.`,
              severity: 'critical',
              type: 'attendance'
            });
          }
        } catch (e) {}
      }
    }
    
    // Process Events
    const incompleteEvents = events.filter(e => !e.isCompleted);
    incompleteEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const upcomingEvents = [];
    
    for (const e of incompleteEvents) {
      const daysLeft = calculateDaysRemaining(e.date);
      if (daysLeft >= -1) {
        upcomingEvents.push({
          event: e,
          course: allCourses.find(c => c.id === e.courseId)
        });
      }
      
      const courseName = allCourses.find(c => c.id === e.courseId)?.name || 'General';
      
      // Rule 2: Exams
      if (e.type === 'exam' && daysLeft >= 0 && daysLeft <= 4) {
        attentionItems.push({
          id: `exam-${e.id}`,
          title: `Upcoming Exam: ${courseName}`,
          subtitle: `${e.title} in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`,
          severity: 'critical',
          type: 'exam'
        });
      }
      
      // Rule 3: Assignments
      if (e.type === 'assignment' && daysLeft >= 0 && daysLeft <= 1) {
        attentionItems.push({
          id: `assig-${e.id}`,
          title: `Due Soon: ${courseName}`,
          subtitle: `${e.title} is due ${daysLeft === 0 ? 'today' : 'tomorrow'}`,
          severity: 'warning',
          type: 'assignment'
        });
      }
    }
    
    attentionItems.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return 0;
    });
    
    return {
      attentionItems: attentionItems.slice(0, 3),
      upcomingEvents: upcomingEvents.slice(0, 3)
    };
  });

  const todaysClasses = useLiveQuery(async () => {
    const profileContext = await db.profile.get('me');
    const activeSemesterId = profileContext?.activeSemesterId;
    
    const todayDayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday...
    
    let slots = await db.routine.where({ dayOfWeek: todayDayOfWeek }).toArray();
    const allCourses = await db.courses.toArray();
    const todaysLogs = await db.attendance.where({ date: today }).toArray();
    const allAttendance = await db.attendance.toArray();
    
    if (activeSemesterId) {
      const activeCourses = allCourses.filter(c => c.semesterId === activeSemesterId);
      slots = slots.filter(slot => activeCourses.some(c => c.id === slot.courseId));
    }
    
    // Sort chronologically by start time (string comparison works for HH:mm)
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // Join with courses and attendance logs entirely in-memory (0 micro-transactions per loop)
    const classesWithCourses = slots.map((slot) => {
      const course = allCourses.find(c => c.id === slot.courseId);
      const log = todaysLogs.find(l => l.courseId === slot.courseId);
      
      const courseLogs = allAttendance.filter(l => l.courseId === slot.courseId);
      let attended = 0;
      let total = 0;
      for (const cl of courseLogs) {
        if (cl.status === 'present' || cl.status === 'late') { attended++; total++; }
        else if (cl.status === 'absent') { total++; }
      }
      
      let predictiveStats = null;
      if (total > 0) {
        try {
          predictiveStats = calculateAttendanceStatus({ attended, total, targetPercentage: profileContext?.targetAttendancePercentage || 75 });
        } catch (e) {}
      }

      return { 
        ...slot, 
        courseName: course?.name || 'Unknown Course',
        todayLog: log,
        predictiveStats
      };
    });
    
    return classesWithCourses;
  });

  const handleQuickLog = async (courseId: string, status: 'present' | 'absent' | 'late') => {
    try {
      const existingLog = await db.attendance.where('[courseId+date]').equals([courseId, today]).first();
      
      if (existingLog) {
        await db.attendance.update(existingLog.id, { 
          status, 
          updatedAt: new Date().toISOString() 
        });
      } else {
        await db.attendance.put({
          id: generateSafeId(),
          courseId,
          date: today,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      hapticImpact('light');
    } catch (e) {
      console.error('Failed to log attendance from dashboard', e);
    }
  };

  const handleUndoLog = async (logId: string) => {
    try {
      await db.attendance.delete(logId);
      hapticImpact('medium');
    } catch (e) {
      console.error('Failed to undo attendance from dashboard', e);
    }
  };

  const [greeting, setGreeting] = useState('Welcome');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    setDateString(new Date().toLocaleDateString(undefined, options));
  }, []);

  const quickActions = [
    { label: 'Target GPA', icon: Target, path: '/tools/target-gpa', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Attendance', icon: CheckSquare, path: '/tools/attendance', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'All Tools', icon: Calculator, path: '/tools', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-full">
      <header className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
        <p className="text-muted-foreground text-sm mt-1">{dateString}</p>
      </header>

      {/* Academic Snapshot */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Academic Snapshot</h2>
        </div>
        
        {!profile ? (
          <Card className="p-6">
            <h3 className="text-xl font-bold text-foreground mb-2">Welcome to Student OS</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Your offline academic decision engine. All calculations happen instantly and securely on this device.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/tools/target-gpa')} variant="primary" className="w-full py-2.5">
                Run a Calculation
              </Button>
              <Button onClick={() => navigate('/profile')} variant="secondary" className="w-full py-2.5">
                Set up Academic Profile
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <div className="flex items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
              <div className="bg-primary/10 p-2.5 rounded-xl mr-3">
                <GraduationCap className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground leading-tight">
                  {profile.universityName || 'University Not Set'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile.department || 'Department Not Set'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {profile.currentCGPA !== undefined && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Current CGPA</p>
                  <p className="text-2xl font-bold text-primary">
                    {profile.currentCGPA.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">({profile.totalCredits} Cr)</span>
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Target CGPA</p>
                <p className="text-2xl font-bold text-foreground">
                  {profile.targetCGPA ? profile.targetCGPA.toFixed(2) : '--'}
                  <span className="text-sm font-normal text-muted-foreground ml-1">/ {profile.maxGradingScale.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.path} className="active:scale-[0.95] transition-transform">
                <Card className="p-3 flex flex-col items-center justify-center text-center h-full">
                  <div className={`p-2 rounded-lg mb-2 ${action.bg}`}>
                    <Icon className={action.color} size={20} />
                  </div>
                  <span className="text-[11px] font-medium text-foreground leading-tight">{action.label}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
      
      {dashboardData && dashboardData.attentionItems.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase mb-3">Attention</h2>
          <div className="space-y-3">
            {dashboardData.attentionItems.map(item => (
              <Card key={item.id} className={`p-4 border-l-4 ${item.severity === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' : 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}>
                <div className="flex items-start">
                  {item.severity === 'critical' ? (
                    <AlertCircle className="text-red-500 mr-3 shrink-0 mt-0.5" size={18} />
                  ) : (
                    <Clock className="text-amber-500 mr-3 shrink-0 mt-0.5" size={18} />
                  )}
                  <div>
                    <h3 className={`font-semibold leading-tight mb-1 text-sm ${item.severity === 'critical' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {item.title}
                    </h3>
                    <p className={`text-xs ${item.severity === 'critical' ? 'text-red-600/80 dark:text-red-400/80' : 'text-amber-600/80 dark:text-amber-400/80'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
      
      {/* Today's Classes Section */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase mb-3">Today's Classes</h2>
        
        {todaysClasses === undefined ? (
          <div className="flex justify-center p-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
          </div>
        ) : !profile?.activeSemesterId ? (
          <Card className="p-5 text-center flex flex-col items-center justify-center">
            <GraduationCap className="text-muted-foreground mb-2 opacity-50" size={32} />
            <p className="text-sm text-muted-foreground mb-4">No active semester selected.</p>
            <Button variant="secondary" onClick={() => navigate('/transcript')} className="px-6 py-2 text-sm">
              Head to Memory to set one up
            </Button>
          </Card>
        ) : todaysClasses.length === 0 ? (
          <Card className="p-5 text-center flex flex-col items-center justify-center">
            <Calendar className="text-muted-foreground mb-2 opacity-50" size={32} />
            <p className="text-sm text-muted-foreground">No classes today. Enjoy your free time!</p>
          </Card>
        ) : !Array.isArray(todaysClasses) ? (
          <div className="text-sm text-muted-foreground p-4 text-center">Loading classes...</div>
        ) : (
          <div className="space-y-4">
            {todaysClasses.map(slot => (
              <Card key={slot.id} className="p-4 border-l-4 border-l-primary">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-bold text-foreground text-lg leading-tight">{slot.courseName}</h3>
                  {slot.predictiveStats ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                      {slot.predictiveStats.currentPercentage}% • {slot.predictiveStats.safeMisses > 0 ? `Skip ${slot.predictiveStats.safeMisses}` : slot.predictiveStats.requiredClasses > 0 ? `Need ${slot.predictiveStats.requiredClasses}` : 'At limit'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">100%</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock size={14} className="mr-2 opacity-70" />
                    <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                  </div>
                  {slot.roomNumber && (
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-2 opacity-70" />
                      <span>Room {slot.roomNumber}</span>
                    </div>
                  )}
                </div>

                <hr className="my-3 border-slate-100 dark:border-slate-800/50" />
                
                {!slot.todayLog ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-2 text-xs bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50"
                      onClick={() => handleQuickLog(slot.courseId, 'present')}
                    >
                      <CheckCircle size={14} className="mr-1.5" /> Present
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-2 text-xs bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900/50"
                      onClick={() => handleQuickLog(slot.courseId, 'absent')}
                    >
                      <XCircle size={14} className="mr-1.5" /> Absent
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-2 text-xs bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50"
                      onClick={() => handleQuickLog(slot.courseId, 'late')}
                    >
                      <Clock size={14} className="mr-1.5" /> Late
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <div className="flex items-center text-sm font-medium">
                      <CheckCircle size={16} className={`mr-2 ${
                        slot.todayLog!.status === 'present' ? 'text-emerald-500' :
                        slot.todayLog!.status === 'absent' ? 'text-red-500' : 'text-orange-500'
                      }`} />
                      <span className="text-foreground capitalize">{slot.todayLog!.status}</span>
                    </div>
                    <button 
                      onClick={() => handleUndoLog(slot.todayLog!.id)}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-2"
                    >
                      Undo
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Up Next Section */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase mb-3">Up Next</h2>
        
        {dashboardData !== undefined ? (
          dashboardData.upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.upcomingEvents.map((data: any) => {
                const daysLeft = calculateDaysRemaining(data.event.date);
                const isUrgent = daysLeft >= 0 && daysLeft <= 3;
                return (
                  <Link key={data.event.id} to="/planner" className="block active:scale-[0.98] transition-transform">
                    <Card className="flex items-center justify-between p-4 border-l-4 border-l-slate-200 dark:border-l-slate-700">
                      <div>
                        <h3 className="font-semibold text-foreground leading-tight">{data.event.title}</h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                          <span className="uppercase tracking-wider font-medium">{data.event.type}</span>
                          {data.course && (
                            <span className="text-blue-600 dark:text-blue-400 font-bold">
                              • {data.course.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center justify-end ${isUrgent ? 'text-red-500 font-bold' : 'text-primary font-medium'}`}>
                          <Clock className="mr-1" size={14} />
                          <span>
                            {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="p-5 text-center flex flex-col items-center justify-center">
              <Calendar className="text-muted-foreground mb-2 opacity-50" size={32} />
              <h3 className="font-medium text-foreground mb-1">Your schedule is clear</h3>
              <p className="text-sm text-muted-foreground mb-4">Enjoy your free time!</p>
              <Button variant="secondary" onClick={() => navigate('/planner')} className="px-6 py-2 text-sm">
                Open Planner
              </Button>
            </Card>
          )
        ) : (
          <Card className="p-5 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
          </Card>
        )}
      </section>
    </div>
  );
}
