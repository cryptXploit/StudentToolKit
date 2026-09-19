import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { calculateRequiredGPA } from '@student-os/engine';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Info, AlertTriangle, Share2 } from 'lucide-react';
import { Card, Input, Label, Alert, Button } from '@student-os/ui';
import { shareContent } from '../../lib/share';

export function TargetGPAScreen() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  
  const [currentCGPA, setCurrentCGPA] = useState('');
  const [currentCredits, setCurrentCredits] = useState('');
  const [targetCGPA, setTargetCGPA] = useState('');
  const [remainingCredits, setRemainingCredits] = useState('');

  // Pre-fill fields from profile if they exist
  useEffect(() => {
    if (profile) {
      if (profile.targetCGPA && !targetCGPA) setTargetCGPA(profile.targetCGPA.toString());
      if (profile.currentCGPA && !currentCGPA) setCurrentCGPA(profile.currentCGPA.toString());
      if (profile.totalCredits && !currentCredits) setCurrentCredits(profile.totalCredits.toString());
    }
  }, [profile]);

  const maxScale = profile?.maxGradingScale || 4.0;

  const { result, error } = useMemo(() => {
    const currGPA = parseFloat(currentCGPA);
    const currCreds = parseFloat(currentCredits);
    const target = parseFloat(targetCGPA);
    const remCreds = parseFloat(remainingCredits);

    if (
      isNaN(currGPA) || isNaN(currCreds) || isNaN(target) || isNaN(remCreds) ||
      remCreds === 0 && currentCGPA === ''
    ) {
      return { result: null, error: null };
    }

    try {
      const res = calculateRequiredGPA({
        currentCGPA: currGPA,
        currentCredits: currCreds,
        targetCGPA: target,
        remainingCredits: remCreds,
        maxScale: maxScale
      });
      return { result: res, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : 'Invalid input' };
    }
  }, [currentCGPA, currentCredits, targetCGPA, remainingCredits, maxScale]);

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-full">
      <header className="mb-6 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Target CGPA</h1>
          <p className="text-muted-foreground text-sm">Scale: {maxScale.toFixed(2)}</p>
        </div>
      </header>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-3">
            <Label className="text-xs mb-1 text-muted-foreground">Current CGPA</Label>
            <Input
              type="number" step="0.01" min="0" max={maxScale}
              className="px-0 py-0 border-none bg-transparent text-lg font-semibold"
              placeholder="e.g. 3.20" value={currentCGPA} onChange={e => setCurrentCGPA(e.target.value)}
            />
          </Card>
          <Card className="p-3">
            <Label className="text-xs mb-1 text-muted-foreground">Completed Credits</Label>
            <Input
              type="number" step="0.5" min="0"
              className="px-0 py-0 border-none bg-transparent text-lg font-semibold"
              placeholder="e.g. 90" value={currentCredits} onChange={e => setCurrentCredits(e.target.value)}
            />
          </Card>
          <Card className="p-3 border-l-4 border-l-primary">
            <Label className="text-xs mb-1 text-muted-foreground">Target CGPA</Label>
            <Input
              type="number" step="0.01" min="0" max={maxScale}
              className="px-0 py-0 border-none bg-transparent text-lg font-semibold"
              placeholder="e.g. 3.50" value={targetCGPA} onChange={e => setTargetCGPA(e.target.value)}
            />
          </Card>
          <Card className="p-3">
            <Label className="text-xs mb-1 text-muted-foreground">Remaining Credits</Label>
            <Input
              type="number" step="0.5" min="0"
              className="px-0 py-0 border-none bg-transparent text-lg font-semibold"
              placeholder="e.g. 30" value={remainingCredits} onChange={e => setRemainingCredits(e.target.value)}
            />
          </Card>
        </div>
      </div>

      <div className="mt-auto">
        {error ? (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Alert variant="error" title="Calculation Error" message={error} icon={AlertTriangle} />
          </div>
        ) : result ? (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
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
              
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                {result.isPossible 
                  ? `To reach your target CGPA of ${targetCGPA}, you need to maintain approximately a ${result.requiredGPA.toFixed(2)} average across your remaining ${remainingCredits} credits.`
                  : `Even if you score a perfect ${maxScale.toFixed(2)} in your remaining credits, you cannot mathematically reach ${targetCGPA}.`
                }
              </p>
              
              {result.isPossible && (
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20"
                  onClick={() => shareContent(
                    'Target GPA Result', 
                    `🎯 I need to maintain a ${result.requiredGPA.toFixed(2)} GPA over my remaining ${remainingCredits} credits to hit my target of ${targetCGPA}! Calculated instantly on Student OS.`
                  )}
                >
                  <Share2 className="mr-2" size={16} /> Share Result
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
