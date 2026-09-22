import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { calculateAttendanceStatus } from '@student-os/engine';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, UserMinus, ShieldAlert, CheckCircle2, TrendingDown } from 'lucide-react';
import { Card, Input, Label } from '@student-os/ui';

export function BunkPlannerScreen() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const allCourses = useLiveQuery(() => db.courses.toArray()) || [];
  const allAttendance = useLiveQuery(() => db.attendance.toArray()) || [];

  const activeCourses = useMemo(() => {
    return allCourses.filter(c => c.semesterId === profile?.activeSemesterId);
  }, [allCourses, profile?.activeSemesterId]);

  const location = useLocation();
  const [selectedCourseId, setSelectedCourseId] = useState<string>((location.state as any)?.courseId || '');
  const [targetOverride, setTargetOverride] = useState<string>('');
  const [simulatedAbsences, setSimulatedAbsences] = useState<string>('');

  const targetPercentage = useMemo(() => {
    if (targetOverride) {
      const p = parseFloat(targetOverride);
      if (!isNaN(p) && p >= 1 && p <= 100) return p;
    }
    return profile?.targetAttendancePercentage || 75;
  }, [targetOverride, profile?.targetAttendancePercentage]);

  const { attended, total } = useMemo(() => {
    if (!selectedCourseId) return { attended: 0, total: 0 };
    
    let a = 0;
    let t = 0;
    for (const log of allAttendance) {
      if (log.courseId === selectedCourseId) {
        if (log.status === 'present' || log.status === 'late') {
          a++;
          t++;
        } else if (log.status === 'absent') {
          t++;
        }
      }
    }
    return { attended: a, total: t };
  }, [selectedCourseId, allAttendance]);

  const currentStatus = useMemo(() => {
    if (total === 0) return null;
    try {
      return calculateAttendanceStatus({ attended, total, targetPercentage });
    } catch (e) {
      return null;
    }
  }, [attended, total, targetPercentage]);

  const projectedStatus = useMemo(() => {
    if (total === 0) return null;
    const absences = parseInt(simulatedAbsences, 10);
    if (isNaN(absences) || absences <= 0) return null;
    
    try {
      return calculateAttendanceStatus({ attended, total: total + absences, targetPercentage });
    } catch (e) {
      return null;
    }
  }, [attended, total, targetPercentage, simulatedAbsences]);

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col min-h-full pb-20">
      <header className="mb-6 mt-2 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Bunk Planner</h1>
          <p className="text-muted-foreground text-sm">Attendance Survival Sandbox.</p>
        </div>
      </header>

      <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 mb-6">
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1 text-muted-foreground block">Select Course</Label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-foreground"
            >
              <option value="" disabled>Choose an active course...</option>
              {activeCourses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1 text-muted-foreground">Target Percentage (%)</Label>
            <Input
              type="number"
              step="1"
              min="1"
              max="100"
              placeholder={`e.g. ${profile?.targetAttendancePercentage || 75}`}
              value={targetOverride}
              onChange={(e) => setTargetOverride(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {selectedCourseId && total === 0 && (
        <Card className="p-6 text-center opacity-80 border-dashed">
          <UserMinus className="mx-auto text-muted-foreground mb-3 opacity-50" size={32} />
          <p className="text-sm text-muted-foreground">
            No attendance logged for this course yet. Log a class to start forecasting.
          </p>
        </Card>
      )}

      {selectedCourseId && currentStatus && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className={`p-5 ${currentStatus.currentPercentage >= targetPercentage ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Current Status</h3>
              <div className="text-2xl font-bold">
                {currentStatus.currentPercentage.toFixed(0)}%
              </div>
            </div>
            
            <div className="flex items-center text-sm mb-4 text-muted-foreground">
              <span className="font-medium mr-2">Attended:</span> {attended} / {total} Classes
            </div>

            <div className="flex items-start">
              {currentStatus.currentPercentage >= targetPercentage ? (
                <>
                  <CheckCircle2 className="text-emerald-500 mr-3 shrink-0" size={20} />
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    You can safely miss the next <span className="font-bold">{currentStatus.safeMisses}</span> classes and stay above {targetPercentage}%.
                  </p>
                </>
              ) : (
                <>
                  <ShieldAlert className="text-red-500 mr-3 shrink-0" size={20} />
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 leading-relaxed">
                    You must attend the next <span className="font-bold">{currentStatus.requiredClasses === -1 ? '∞' : currentStatus.requiredClasses}</span> consecutive classes to reach {targetPercentage}%.
                    {currentStatus.requiredClasses === -1 && " (Mathematically impossible)"}
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card className="p-5 bg-slate-900 dark:bg-slate-950 border-slate-800 shadow-xl">
            <h3 className="font-bold text-white mb-4 flex items-center">
              <UserMinus className="mr-2 text-red-400" size={18} />
              Sandbox
            </h3>
            <div className="mb-6">
              <Label className="text-xs mb-1 text-white/60 block">What if I miss...</Label>
              <div className="flex items-center">
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 2"
                  value={simulatedAbsences}
                  onChange={(e) => setSimulatedAbsences(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white w-24 text-center text-lg font-bold mr-3"
                />
                <span className="text-white/60 font-medium">classes?</span>
              </div>
            </div>

            {projectedStatus && (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5 animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-white/50">Projected Drop</span>
                  <span className="text-lg font-bold text-white flex items-center">
                    <TrendingDown className="text-red-400 mr-1.5" size={16} />
                    {projectedStatus.currentPercentage.toFixed(0)}%
                  </span>
                </div>
                
                {projectedStatus.currentPercentage < targetPercentage ? (
                  <p className="text-xs text-red-300 font-medium leading-relaxed">
                    Warning: This drops you below your {targetPercentage}% target.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-300 font-medium leading-relaxed">
                    Safe! You will still be above your target.
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}


