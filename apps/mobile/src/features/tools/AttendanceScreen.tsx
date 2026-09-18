import { useState, useMemo } from 'react';
import { calculateAttendanceStatus } from '@student-os/engine';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export function AttendanceScreen() {
  const [attended, setAttended] = useState('');
  const [total, setTotal] = useState('');
  const [targetPercentage, setTargetPercentage] = useState('75');

  const result = useMemo(() => {
    const att = parseInt(attended, 10);
    const tot = parseInt(total, 10);
    const target = parseFloat(targetPercentage);

    if (
      isNaN(att) || isNaN(tot) || isNaN(target) ||
      att < 0 || tot <= 0 || att > tot || target <= 0 || target > 100
    ) {
      return null;
    }

    try {
      return calculateAttendanceStatus({
        attended: att,
        total: tot,
        targetPercentage: target
      });
    } catch (e) {
      return null;
    }
  }, [attended, total, targetPercentage]);

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-full">
      <header className="mb-6 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Attendance Engine</h1>
          <p className="text-muted text-sm">Can you safely miss this class?</p>
        </div>
      </header>

      <div className="space-y-4 mb-6">
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Attended Classes</label>
              <input
                type="number" min="0" step="1"
                className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-lg font-semibold text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. 15" value={attended} onChange={e => setAttended(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Total Classes</label>
              <input
                type="number" min="1" step="1"
                className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-lg font-semibold text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. 18" value={total} onChange={e => setTotal(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Target Percentage (%)</label>
            <input
              type="number" min="1" max="100" step="1"
              className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-lg font-semibold text-foreground focus:outline-none focus:border-primary"
              placeholder="75" value={targetPercentage} onChange={e => setTargetPercentage(e.target.value)}
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm mb-4">
            <h3 className="text-sm font-medium text-muted mb-1">Current Attendance</h3>
            <div className={`text-4xl font-bold ${result.currentPercentage >= parseFloat(targetPercentage) ? 'text-emerald-500' : 'text-red-500'}`}>
              {result.currentPercentage.toFixed(1)}%
            </div>
          </div>

          <div className={`p-5 rounded-2xl ${
            result.safeMisses > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200' : 
            result.requiredClasses === -1 ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200' : 
            'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex items-center mb-2">
              {result.safeMisses > 0 && <CheckCircle2 className="mr-2 opacity-80" size={20} />}
              {result.safeMisses === 0 && result.requiredClasses !== -1 && <AlertTriangle className="mr-2 opacity-80" size={20} />}
              {result.requiredClasses === -1 && <XCircle className="mr-2 opacity-80" size={20} />}
              <h2 className="text-sm font-medium opacity-90">
                {result.safeMisses > 0 ? 'You are in the safe zone' : 
                 result.requiredClasses === -1 ? 'Mathematically impossible' : 
                 'Attendance shortage risk'}
              </h2>
            </div>
            
            <p className="text-sm opacity-90 leading-relaxed font-medium">
              {result.safeMisses > 0 && `You can safely miss the next ${result.safeMisses} class${result.safeMisses > 1 ? 'es' : ''} and remain above ${targetPercentage}%.`}
              {result.safeMisses === 0 && result.requiredClasses > 0 && `You must attend the next ${result.requiredClasses} consecutive class${result.requiredClasses > 1 ? 'es' : ''} to reach ${targetPercentage}%.`}
              {result.safeMisses === 0 && result.requiredClasses === 0 && `You are exactly at your target. Do not miss the next class.`}
              {result.requiredClasses === -1 && `Even if you attend all remaining classes, you cannot reach ${targetPercentage}%.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
