import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { Button } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';

export function StopwatchScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);

  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  const startTimer = () => {
    hapticImpact('heavy');
    setIsRunning(true);
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      setElapsedTime(accumulatedTimeRef.current + (Date.now() - startTimeRef.current));
    }, 40);
  };

  const pauseTimer = () => {
    hapticImpact('medium');
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    accumulatedTimeRef.current += (Date.now() - startTimeRef.current);
    setElapsedTime(accumulatedTimeRef.current);
  };

  const resetTimer = () => {
    hapticImpact('light');
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    accumulatedTimeRef.current = 0;
    setElapsedTime(0);
    setLaps([]);
  };

  const recordLap = () => {
    hapticImpact('light');
    const exactTime = accumulatedTimeRef.current + (Date.now() - startTimeRef.current);
    setLaps(prev => [exactTime, ...prev]);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (ms: number) => {
    const pad = (num: number, digits: number) => num.toString().padStart(digits, '0');
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const centi = Math.floor((ms % 1000) / 10);
    return `${pad(min, 2)}:${pad(sec, 2)}.${pad(centi, 2)}`;
  };

  const currentLapTime = useMemo(() => {
    if (laps.length === 0) return elapsedTime;
    return elapsedTime - laps[0];
  }, [elapsedTime, laps]);

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-screen sm:h-full pb-20">
      <header className="mb-8 mt-2 flex items-center shrink-0">
        <Link className="p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Stopwatch</h1>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center py-6 shrink-0">
        <div className="text-7xl font-black tabular-nums tracking-tighter text-foreground">
          {formatTime(elapsedTime)}
        </div>
        <div className="text-muted-foreground font-mono text-lg mt-2 font-medium tracking-widest tabular-nums h-8">
          {laps.length > 0 && isRunning ? formatTime(currentLapTime) : ''}
        </div>

        <div className="flex items-center w-full justify-between gap-4 mt-10">
          {!isRunning ? (
            <>
              <Button 
                variant="ghost" 
                className={`flex-1 h-16 text-lg rounded-2xl ${elapsedTime > 0 ? 'text-muted-foreground' : 'opacity-0 pointer-events-none'}`}
                onClick={resetTimer}
              >
                <RotateCcw className="mr-2" size={20} />
                Reset
              </Button>
              <Button 
                variant="primary" 
                className="flex-1 h-16 text-lg rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-700 shadow-xl shadow-fuchsia-600/20"
                onClick={startTimer}
              >
                <Play className="mr-2" size={20} />
                Start
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="flex-1 h-16 text-lg rounded-2xl text-muted-foreground bg-slate-100 dark:bg-slate-800"
                onClick={recordLap}
              >
                <Flag className="mr-2" size={20} />
                Lap
              </Button>
              <Button 
                variant="primary" 
                className="flex-1 h-16 text-lg rounded-2xl bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20"
                onClick={pauseTimer}
              >
                <Pause className="mr-2" size={20} />
                Pause
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar mt-6 border-t border-slate-200 dark:border-slate-800">
        {laps.map((lap, idx) => {
          const previousLap = idx === laps.length - 1 ? 0 : laps[idx + 1];
          const splitTime = lap - previousLap;
          const lapNumber = laps.length - idx;
          
          return (
            <div key={lapNumber} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2">
              <span className="text-muted-foreground font-medium w-16">Lap {padDigits(lapNumber, 2)}</span>
              <span className="text-foreground font-mono text-sm opacity-70">+{formatTime(splitTime)}</span>
              <span className="text-foreground font-mono font-bold text-lg">{formatTime(lap)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function padDigits(num: number, digits: number) {
  return num.toString().padStart(digits, '0');
}

