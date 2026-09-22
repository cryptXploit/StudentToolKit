import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { calculateSemesterGPA, calculateCumulativeCGPA } from '@student-os/engine';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, TrendingUp, TrendingDown, Minus, BookX } from 'lucide-react';
import { Card, Input, Label, Button } from '@student-os/ui';

export function AcademicWhatIfScreen() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const allCourses = useLiveQuery(() => db.courses.toArray()) || [];
  
  const activeCourses = useMemo(() => {
    return allCourses.filter(c => c.semesterId === profile?.activeSemesterId);
  }, [allCourses, profile?.activeSemesterId]);

  const [simulatedGrades, setSimulatedGrades] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && activeCourses.length > 0) {
      const initial: Record<string, string> = {};
      activeCourses.forEach(c => {
        if (typeof c.grade === 'number' && c.grade >= 0) {
          initial[c.id] = c.grade.toString();
        } else {
          initial[c.id] = '';
        }
      });
      setSimulatedGrades(initial);
      setIsInitialized(true);
    }
  }, [activeCourses, isInitialized]);

  const handleGradeChange = (id: string, val: string) => {
    setSimulatedGrades(prev => ({ ...prev, [id]: val }));
  };

  const { baseline, projected } = useMemo(() => {
    const computeStats = (coursesArray: any[]) => {
      let activeSemGPA = 0.00;
      const semRecords: { credit: number; gpa: number }[] = [];
      
      const bySem: Record<string, any[]> = {};
      for (const c of coursesArray) {
        if (!bySem[c.semesterId]) bySem[c.semesterId] = [];
        if (typeof c.grade === 'number' && c.grade >= 0 && typeof c.credit === 'number' && c.credit > 0) {
          bySem[c.semesterId].push({ credits: c.credit, gradePoint: c.grade });
        }
      }

      for (const semId in bySem) {
        const records = bySem[semId];
        if (records.length === 0) continue;
        
        let semGpa = 0.00;
        try { semGpa = calculateSemesterGPA(records); } catch(e) {}
        
        const totalCreds = records.reduce((acc, r) => acc + r.credits, 0);
        semRecords.push({ credit: totalCreds, gpa: semGpa });
        
        if (semId === profile?.activeSemesterId) {
          activeSemGPA = semGpa;
        }
      }
      
      let cumulative = 0.00;
      try { cumulative = calculateCumulativeCGPA(semRecords); } catch(e) {}
      
      return { semesterGPA: activeSemGPA, cumulativeCGPA: cumulative };
    };

    const baselineStats = computeStats(allCourses);
    
    const modifiedCourses = allCourses.map(c => {
      if (simulatedGrades[c.id] !== undefined) {
        const val = parseFloat(simulatedGrades[c.id]);
        return { ...c, grade: isNaN(val) ? undefined : val };
      }
      return c;
    });
    
    const projectedStats = computeStats(modifiedCourses);

    return { baseline: baselineStats, projected: projectedStats };
  }, [allCourses, simulatedGrades, profile?.activeSemesterId]);

  const renderTrend = (base: number, proj: number) => {
    const diff = proj - base;
    if (Math.abs(diff) < 0.01) {
      return (
        <span className="flex items-center text-xs text-muted-foreground font-medium">
          <Minus size={12} className="mr-1" /> Unchanged ({base.toFixed(2)})
        </span>
      );
    }
    if (diff > 0) {
      return (
        <span className="flex items-center text-xs text-emerald-500 font-medium">
          <TrendingUp size={12} className="mr-1" /> +{diff.toFixed(2)} (was {base.toFixed(2)})
        </span>
      );
    }
    return (
      <span className="flex items-center text-xs text-red-500 font-medium">
        <TrendingDown size={12} className="mr-1" /> {diff.toFixed(2)} (was {base.toFixed(2)})
      </span>
    );
  };

  const maxScale = profile?.maxGradingScale || 4.0;

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col min-h-full pb-20">
      <header className="mb-6 mt-2 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Academic What-If</h1>
          <p className="text-muted-foreground text-sm">Simulate active semester grades.</p>
        </div>
      </header>

      {!profile?.activeSemesterId || activeCourses.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center opacity-80 mt-10">
          <BookX className="text-muted-foreground mb-4 opacity-50" size={48} />
          <h3 className="text-lg font-bold text-foreground mb-2">No Active Courses</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please set an active semester and add courses in your Transcript to use the Simulator.
          </p>
          <Link to="/transcript" className="mt-6">
            <Button variant="primary">Go to Transcript</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="sticky top-4 z-10 mb-8">
            <Card className="p-4 bg-slate-900 dark:bg-slate-950 border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center text-white">
                  <HelpCircle className="mr-2 opacity-70 text-orange-400" size={20} />
                  <h2 className="font-semibold tracking-wide">Projection Result</h2>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-white/50">Real-Time</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">Semester GPA</span>
                  <span className="text-3xl font-bold text-white mb-1">{projected.semesterGPA.toFixed(2)}</span>
                  {renderTrend(baseline.semesterGPA, projected.semesterGPA)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">Global CGPA</span>
                  <span className="text-3xl font-bold text-white mb-1">{projected.cumulativeCGPA.toFixed(2)}</span>
                  {renderTrend(baseline.cumulativeCGPA, projected.cumulativeCGPA)}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Active Semester Courses</h3>
            {activeCourses.map(course => (
              <Card key={course.id} className="p-4 flex items-center justify-between border-l-4 border-l-orange-400">
                <div className="flex-1 pr-4">
                  <h4 className="font-bold text-foreground text-sm mb-1">{course.name}</h4>
                  <p className="text-xs text-muted-foreground">{course.credit} Credits</p>
                </div>
                <div className="w-24 shrink-0">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Expected</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={maxScale}
                    placeholder="e.g. 4.0"
                    value={simulatedGrades[course.id] ?? ''}
                    onChange={(e) => handleGradeChange(course.id, e.target.value)}
                    className="font-bold text-center bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </Card>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 p-3 rounded-lg inline-block">
              These changes are completely ephemeral and will not affect your actual transcript.
            </p>
          </div>
        </>
      )}
    </div>
  );
}


