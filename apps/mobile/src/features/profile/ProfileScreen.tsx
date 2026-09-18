import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { GraduationCap, BookOpen, Target, Hash, Check } from 'lucide-react';

export function ProfileScreen() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  
  const [universityName, setUniversityName] = useState('');
  const [department, setDepartment] = useState('');
  const [maxScale, setMaxScale] = useState('4.00');
  const [targetCGPA, setTargetCGPA] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Sync local form state when DB profile loads
  useEffect(() => {
    if (profile) {
      setUniversityName(profile.universityName || '');
      setDepartment(profile.department || '');
      setMaxScale(profile.maxGradingScale?.toFixed(2) || '4.00');
      if (profile.targetCGPA) setTargetCGPA(profile.targetCGPA.toFixed(2));
    }
  }, [profile]);

  const handleSave = async () => {
    await db.profile.put({
      id: 'me',
      universityName: universityName.trim(),
      department: department.trim(),
      maxGradingScale: parseFloat(maxScale) || 4.0,
      targetCGPA: targetCGPA ? parseFloat(targetCGPA) : undefined,
      updatedAt: Date.now(),
    });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Academic Profile</h1>
        <p className="text-muted text-sm mt-1">Set your context for accurate calculations.</p>
      </header>

      <div className="space-y-4">
        {/* University & Dept */}
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-foreground mb-1.5">
              <GraduationCap className="mr-2 text-primary" size={16} />
              University Name
            </label>
            <input
              type="text"
              className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. Rajshahi University"
              value={universityName}
              onChange={(e) => setUniversityName(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-foreground mb-1.5">
              <BookOpen className="mr-2 text-primary" size={16} />
              Department
            </label>
            <input
              type="text"
              className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. ICE"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
        </div>

        {/* Grading Scale & Target */}
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-foreground mb-1.5">
              <Hash className="mr-2 text-primary" size={16} />
              Max Grading Scale
            </label>
            <input
              type="number"
              step="0.01"
              min="1.0"
              max="10.0"
              className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
              value={maxScale}
              onChange={(e) => setMaxScale(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-foreground mb-1.5">
              <Target className="mr-2 text-primary" size={16} />
              Target CGPA (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="1.0"
              max="10.0"
              className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. 3.50"
              value={targetCGPA}
              onChange={(e) => setTargetCGPA(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-6 w-full bg-primary text-white font-medium rounded-xl py-3 flex items-center justify-center active:scale-[0.98] transition-transform"
      >
        {isSaved ? (
          <>
            <Check className="mr-2" size={20} />
            Saved Locally
          </>
        ) : (
          'Save Profile'
        )}
      </button>
      
      <p className="text-center text-xs text-muted mt-4">
        Your data never leaves your device.
      </p>
    </div>
  );
}
