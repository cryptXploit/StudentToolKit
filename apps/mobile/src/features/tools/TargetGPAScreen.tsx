import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { calculateRequiredGPA } from '@student-os/engine';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Info } from 'lucide-react';

export function TargetGPAScreen() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  
  const [currentCGPA, setCurrentCGPA] = useState('');
  const [currentCredits, setCurrentCredits] = useState('');
  const [targetCGPA, setTargetCGPA] = useState('');
  const [remainingCredits, setRemainingCredits] = useState('');

  // Pre-fill target CGPA if it exists in profile
  useEffect(() => {
    if (profile?.targetCGPA && !targetCGPA) {
      setTargetCGPA(profile.targetCGPA.toString());
    }
  }, [profile]);

  const maxScale = profile?.maxGradingScale || 4.0;

  const result = useMemo(() => {
    const currGPA = parseFloat(currentCGPA);
    const currCreds = parseFloat(currentCredits);
    const target = parseFloat(targetCGPA);
    const remCreds = parseFloat(remainingCredits);

    if (
      isNaN(currGPA) || isNaN(currCreds) || isNaN(target) || isNaN(remCreds) ||
      remCreds <= 0 || currCreds < 0
    ) {
      return null;
    }

    try {
      return calculateRequiredGPA({
        currentCGPA: currGPA,
        currentCredits: currCreds,
        targetCGPA: target,
        remainingCredits: remCreds,
        maxScale: maxScale
      });
    } catch (e) {
      return null;
    }
  }, [currentCGPA, currentCredits, targetCGPA, remainingCredits, maxScale]);

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-full">
      <header className="mb-6 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Target CGPA</h1>
          <p className="text-muted text-sm">Scale: {maxScale.toFixed(2)}</p>
        </div>
      </header>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
            <label className="block text-xs font-medium text-muted mb-1">Current CGPA</label>
            <input
              type="number" step="0.01" min="0" max={maxScale}
              className="w-full bg-transparent text-lg font-semibold text-foreground focus:outline-none"
              placeholder="e.g. 3.20" value={currentCGPA} onChange={e => setCurrentCGPA(e.target.value)}
            />
          </div>
          <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
            <label className="block text-xs font-medium text-muted mb-1">Completed Credits</label>
            <input
              type="number" step="0.5" min="0"
              className="w-full bg-transparent text-lg font-semibold text-foreground focus:outline-none"
              placeholder="e.g. 90" value={currentCredits} onChange={e => setCurrentCredits(e.target.value)}
            />
          </div>
          <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm border-l-4 border-l-primary">
            <label className="block text-xs font-medium text-muted mb-1">Target CGPA</label>
            <input
              type="number" step="0.01" min="0" max={maxScale}
              className="w-full bg-transparent text-lg font-semibold text-foreground focus:outline-none"
              placeholder="e.g. 3.50" value={targetCGPA} onChange={e => setTargetCGPA(e.target.value)}
            />
          </div>
          <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
            <label className="block text-xs font-medium text-muted mb-1">Remaining Credits</label>
            <input
              type="number" step="0.5" min="0.5"
              className="w-full bg-transparent text-lg font-semibold text-foreground focus:outline-none"
              placeholder="e.g. 30" value={remainingCredits} onChange={e => setRemainingCredits(e.target.value)}
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`p-5 rounded-2xl ${result.isPossible ? 'bg-primary text-white' : 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'}`}>
            <div className="flex items-center mb-2">
              {result.isPossible ? <Target className="mr-2 opacity-80" size={20} /> : <Info className="mr-2 opacity-80" size={20} />}
              <h2 className="text-sm font-medium opacity-90">
                {result.isPossible ? 'Required Average GPA' : 'Target mathematically impossible'}
              </h2>
            </div>
            
            <div className="text-4xl font-bold mb-3">
              {result.requiredGPA.toFixed(2)}
            </div>
            
            <p className="text-sm opacity-90 leading-relaxed">
              {result.isPossible 
                ? `To reach your target CGPA of ${targetCGPA}, you need to maintain approximately a ${result.requiredGPA.toFixed(2)} average across your remaining ${remainingCredits} credits.`
                : `Even if you score a perfect ${maxScale.toFixed(2)} in your remaining credits, you cannot mathematically reach ${targetCGPA}.`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
