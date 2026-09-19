import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { calculateCumulativeCGPA } from '@student-os/engine';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Share2, Save } from 'lucide-react';
import { Card, Input, Button } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';
import { shareContent } from '../../lib/share';

export function CumulativeCGPAScreen() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const [isSaved, setIsSaved] = useState(false);

  const [semesters, setSemesters] = useState([
    { id: crypto.randomUUID(), name: '', credit: '', gpa: '' },
    { id: crypto.randomUUID(), name: '', credit: '', gpa: '' },
    { id: crypto.randomUUID(), name: '', credit: '', gpa: '' }
  ]);

  const { cgpa, totalCredits } = useMemo(() => {
    let validCredits = 0;
    const validSemesters = semesters
      .map(s => {
        const cred = parseFloat(s.credit);
        const gpa = parseFloat(s.gpa);
        return { cred, gpa };
      })
      .filter(s => !isNaN(s.cred) && s.cred > 0 && !isNaN(s.gpa));

    const records = validSemesters.map(s => {
      validCredits += s.cred;
      return { credit: s.cred, gpa: s.gpa };
    });

    setIsSaved(false); // Reset saved state when inputs change

    try {
      const calcCGPA = calculateCumulativeCGPA(records);
      return { cgpa: calcCGPA, totalCredits: validCredits };
    } catch (e) {
      return { cgpa: 0, totalCredits: validCredits };
    }
  }, [semesters]);

  const handleSave = async () => {
    hapticImpact('light');
    const updatedProfile = profile ? { ...profile } : { 
      id: 'me', 
      maxGradingScale: 4.0, 
      updatedAt: Date.now() 
    };
    
    await db.profile.put({
      ...updatedProfile,
      currentCGPA: cgpa,
      totalCredits: totalCredits,
      updatedAt: Date.now()
    });
    
    setIsSaved(true);
  };

  const addSemester = () => {
    hapticImpact('light');
    setSemesters([...semesters, { id: crypto.randomUUID(), name: '', credit: '', gpa: '' }]);
  };

  const removeSemester = (id: string) => {
    if (semesters.length > 1) {
      hapticImpact('medium');
      setSemesters(semesters.filter(s => s.id !== id));
    }
  };

  const updateSemester = (id: string, field: 'name' | 'credit' | 'gpa', value: string) => {
    setSemesters(semesters.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-full">
      <header className="mb-6 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Cumulative CGPA</h1>
          <p className="text-muted text-sm">Combine past semesters</p>
        </div>
      </header>

      <Card className="mb-6 p-5 border-l-4 border-l-primary">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-muted mb-1">Cumulative CGPA</h2>
            <div className="text-4xl font-bold text-primary">{cgpa.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Total Credits</p>
            <div className="text-2xl font-semibold text-foreground">{totalCredits}</div>
          </div>
        </div>
        {cgpa > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              className={`flex-1 ${isSaved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'}`}
              onClick={handleSave}
            >
              <Save className="mr-2" size={16} /> {isSaved ? 'Saved! ✅' : 'Save to Profile'}
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              onClick={() => shareContent(
                'Cumulative CGPA Result', 
                `🎓 My current Cumulative CGPA is ${cgpa.toFixed(2)} across ${totalCredits} credits! Calculated instantly on Student OS.`
              )}
            >
              <Share2 className="mr-2" size={16} /> Share
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-3 flex-1 overflow-y-auto pb-6">
        <div className="flex px-1 text-xs font-medium text-muted uppercase tracking-wider mb-2">
          <div className="flex-[2] mr-2">Semester (Opt)</div>
          <div className="flex-1 mr-2">Credits</div>
          <div className="flex-1 mr-12">GPA</div>
        </div>
        
        {semesters.map((semester) => (
          <div key={semester.id} className="flex items-center gap-2">
            <div className="flex-[2]">
              <Input
                type="text"
                placeholder="Name"
                value={semester.name}
                onChange={e => updateSemester(semester.id, 'name', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min="0" step="0.5"
                placeholder="Cr"
                value={semester.credit}
                onChange={e => updateSemester(semester.id, 'credit', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min="0" max="10" step="0.01"
                placeholder="GPA"
                value={semester.gpa}
                onChange={e => updateSemester(semester.id, 'gpa', e.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              className="p-2 h-10 w-10 shrink-0 text-slate-400 hover:text-red-500"
              onClick={() => removeSemester(semester.id)}
              disabled={semesters.length <= 1}
            >
              <Trash2 size={18} />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button variant="secondary" onClick={addSemester} className="w-full py-3">
          <Plus className="mr-2" size={18} /> Add Semester
        </Button>
      </div>
    </div>
  );
}
