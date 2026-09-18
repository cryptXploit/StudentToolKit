"use client";

import { useState, useMemo } from 'react';
import { calculateRequiredGPA } from '@student-os/engine';
import { Target, Download } from 'lucide-react';

export default function TargetCGPAPage() {
  const [currentCGPA, setCurrentCGPA] = useState('');
  const [currentCredits, setCurrentCredits] = useState('');
  const [targetCGPA, setTargetCGPA] = useState('');
  const [remainingCredits, setRemainingCredits] = useState('');

  const result = useMemo(() => {
    const currGPA = parseFloat(currentCGPA);
    const currCreds = parseFloat(currentCredits);
    const target = parseFloat(targetCGPA);
    const remCreds = parseFloat(remainingCredits);

    if (isNaN(currGPA) || isNaN(currCreds) || isNaN(target) || isNaN(remCreds) || remCreds <= 0 || currCreds < 0) {
      return null;
    }
    try {
      return calculateRequiredGPA({ currentCGPA: currGPA, currentCredits: currCreds, targetCGPA: target, remainingCredits: remCreds, maxScale: 4.0 });
    } catch (e) {
      return null;
    }
  }, [currentCGPA, currentCredits, targetCGPA, remainingCredits]);

  return (
    <main className="max-w-3xl mx-auto p-6 mt-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3">Target CGPA Calculator</h1>
        <p className="text-muted">Calculate exactly what you need in your remaining semesters.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm mb-8">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Current CGPA</label>
            <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-3" placeholder="e.g. 3.20" value={currentCGPA} onChange={e => setCurrentCGPA(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Completed Credits</label>
            <input type="number" step="0.5" className="w-full border border-slate-300 rounded-lg p-3" placeholder="e.g. 90" value={currentCredits} onChange={e => setCurrentCredits(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Target CGPA</label>
            <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-3" placeholder="e.g. 3.50" value={targetCGPA} onChange={e => setTargetCGPA(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Remaining Credits</label>
            <input type="number" step="0.5" className="w-full border border-slate-300 rounded-lg p-3" placeholder="e.g. 30" value={remainingCredits} onChange={e => setRemainingCredits(e.target.value)} />
          </div>
        </div>

        {result && (
          <div className={`p-6 rounded-xl ${result.isPossible ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-700'}`}>
            <h3 className="font-semibold text-lg mb-2">{result.isPossible ? 'Required Average GPA' : 'Mathematically Impossible'}</h3>
            <div className="text-4xl font-bold mb-3">{result.requiredGPA.toFixed(2)}</div>
            <p className="text-sm opacity-90">
              {result.isPossible 
                ? `You need to average ${result.requiredGPA.toFixed(2)} across your remaining ${remainingCredits} credits to reach ${targetCGPA}.`
                : `Even with perfect grades, you cannot reach ${targetCGPA}.`
              }
            </p>
          </div>
        )}
      </div>

      {/* App Funnel CTA */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 text-center">
        <Download className="mx-auto mb-4" size={32} />
        <h2 className="text-2xl font-bold mb-2">Get the Offline App</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">Save your profile, track attendance, and manage your academic timeline without ever needing an internet connection.</p>
        <button className="bg-white text-slate-900 font-semibold px-8 py-3 rounded-xl hover:bg-slate-100 transition-colors">
          Download for Android
        </button>
      </div>
    </main>
  );
}
