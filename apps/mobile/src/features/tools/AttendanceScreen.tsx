import { useState, useMemo } from 'react';
import { calculateAttendanceStatus } from '@student-os/engine';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Share2 } from 'lucide-react';
import { Card, Input, Label, Alert, Button } from '@student-os/ui';
import { shareContent } from '../../lib/share';

export function AttendanceScreen() {
  const [attended, setAttended] = useState('');
  const [total, setTotal] = useState('');
  const [targetPercentage, setTargetPercentage] = useState('75');

  const { result, error } = useMemo(() => {
    const att = parseInt(attended, 10);
    const tot = parseInt(total, 10);
    const target = parseFloat(targetPercentage);

    // Don't show errors if inputs are empty or clearly non-numeric,
    // wait for them to finish typing. We only catch domain logic errors.
    if (isNaN(att) || isNaN(tot) || isNaN(target) || total === '' || attended === '') {
      return { result: null, error: null };
    }

    try {
      const res = calculateAttendanceStatus({
        attended: att,
        total: tot,
        targetPercentage: target
      });
      return { result: res, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : 'Invalid input' };
    }
  }, [attended, total, targetPercentage]);

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-full">
      <header className="mb-6 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Attendance Engine</h1>
          <p className="text-muted-foreground text-sm">Can you safely miss this class?</p>
        </div>
      </header>

      <div className="space-y-4 mb-6">
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 text-muted-foreground">Attended Classes</Label>
              <Input
                type="number" min="0" step="1"
                className="text-lg font-semibold"
                placeholder="e.g. 15" value={attended} onChange={e => setAttended(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 text-muted-foreground">Total Classes</Label>
              <Input
                type="number" min="1" step="1"
                className="text-lg font-semibold"
                placeholder="e.g. 18" value={total} onChange={e => setTotal(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 text-muted-foreground">Target Percentage (%)</Label>
            <Input
              type="number" min="1" max="100" step="1"
              className="text-lg font-semibold"
              placeholder="75" value={targetPercentage} onChange={e => setTargetPercentage(e.target.value)}
            />
          </div>
        </Card>
      </div>

      <div className="mt-auto">
        {error ? (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Alert variant="error" title="Calculation Error" message={error} icon={AlertTriangle} />
          </div>
        ) : result ? (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Card className="p-5 mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Attendance</h3>
              <div className={`text-4xl font-bold ${result.currentPercentage >= parseFloat(targetPercentage) ? 'text-emerald-500' : 'text-red-500'}`}>
                {result.currentPercentage.toFixed(1)}%
              </div>
            </Card>

            <Alert 
              variant={result.safeMisses > 0 ? 'success' : result.requiredClasses === -1 ? 'error' : 'warning'}
              icon={result.safeMisses > 0 ? CheckCircle2 : result.requiredClasses === -1 ? XCircle : AlertTriangle}
              title={
                result.safeMisses > 0 ? 'You are in the safe zone' : 
                result.requiredClasses === -1 ? 'Mathematically impossible' : 
                'Attendance shortage risk'
              }
              message={
                (result.safeMisses > 0 && `You can safely miss the next ${result.safeMisses} class${result.safeMisses > 1 ? 'es' : ''} and remain above ${targetPercentage}%.`) ||
                (result.safeMisses === 0 && result.requiredClasses > 0 && `You must attend the next ${result.requiredClasses} consecutive class${result.requiredClasses > 1 ? 'es' : ''} to reach ${targetPercentage}%.`) ||
                (result.safeMisses === 0 && result.requiredClasses === 0 && `You are exactly at your target. Do not miss the next class.`) ||
                (result.requiredClasses === -1 && `Even if you attend all remaining classes, you cannot reach ${targetPercentage}%.`) || ''
              }
            />
            
            {result.requiredClasses !== -1 && (
              <Button 
                variant="secondary" 
                className="w-full mt-4 bg-transparent border-slate-200 dark:border-slate-800"
                onClick={() => {
                  let text = '';
                  if (result.safeMisses > 0) {
                    text = `🛑 I can safely miss ${result.safeMisses} more class${result.safeMisses > 1 ? 'es' : ''} and still keep my attendance on track! Calculated instantly on Student OS.`;
                  } else if (result.requiredClasses > 0) {
                    text = `⚠️ I need to attend the next ${result.requiredClasses} class${result.requiredClasses > 1 ? 'es' : ''} to recover my attendance! Calculated instantly on Student OS.`;
                  } else {
                    text = `🎯 My attendance is exactly on track, no room for errors! Calculated instantly on Student OS.`;
                  }
                  shareContent('Attendance Result', text);
                }}
              >
                <Share2 className="mr-2" size={16} /> Share Result
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
