import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ArrowLeft, Play, Pause, RotateCcw, Timer, Coffee, Moon } from 'lucide-react';
import { Button } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';

const MODES = {
  focus: { label: 'Focus', time: 25 * 60, icon: Timer },
  short: { label: 'Short Break', time: 5 * 60, icon: Coffee },
  long: { label: 'Long Break', time: 15 * 60, icon: Moon }
};

type Mode = keyof typeof MODES;
const NOTIF_ID = 8888;

export function PomodoroScreen() {
  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(MODES.focus.time);
  const [isActive, setIsActive] = useState(false);

  const timerRef = useRef<any>(null);

  const cancelNotification = async () => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
    } catch (e) {
      console.log('Failed to cancel notification', e);
    }
  };

  const scheduleNotification = async (seconds: number) => {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }
      
      const targetTime = new Date(Date.now() + seconds * 1000);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIF_ID,
            title: 'Timer Complete',
            body: `Your ${MODES[mode].label} session is finished.`,
            schedule: { at: targetTime },
            sound: 'beep.wav',
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (e) {
      console.log('Failed to schedule notification', e);
    }
  };

  const toggleTimer = async () => {
    if (isActive) {
      hapticImpact('medium');
      setIsActive(false);
      await cancelNotification();
    } else {
      hapticImpact('heavy');
      setIsActive(true);
      if (timeLeft > 0) {
        await scheduleNotification(timeLeft);
      }
    }
  };

  const resetTimer = async () => {
    hapticImpact('light');
    setIsActive(false);
    setTimeLeft(MODES[mode].time);
    await cancelNotification();
  };

  const switchMode = async (newMode: Mode) => {
    if (newMode === mode) return;
    hapticImpact('light');
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].time);
    await cancelNotification();
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            hapticImpact('heavy');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    return () => {
      cancelNotification();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((MODES[mode].time - timeLeft) / MODES[mode].time) * 100;
  const dashArray = 753.98;
  const dashOffset = dashArray - (dashArray * progress) / 100;

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col min-h-full pb-20">
      <header className="mb-8 mt-2 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Pomodoro Timer</h1>
          <p className="text-muted-foreground text-sm">Quiet intelligence.</p>
        </div>
      </header>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-12">
        {(Object.keys(MODES) as Mode[]).map(m => {
          const Icon = MODES[m].icon;
          return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 flex items-center justify-center py-2.5 text-xs font-bold rounded-lg transition-all ${
                mode === m 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} className="mr-1.5 hidden sm:block" />
              {MODES[m].label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-center py-6 flex-1">
        <div className="relative flex items-center justify-center w-64 h-64 mb-8">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle cx="128" cy="128" r="120" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="6" fill="none" />
            <circle 
              cx="128" 
              cy="128" 
              r="120" 
              className="stroke-primary transition-all duration-1000 ease-linear" 
              strokeWidth="6" 
              fill="none" 
              strokeDasharray={dashArray} 
              strokeDashoffset={dashOffset} 
              strokeLinecap="round" 
            />
          </svg>
          <div className="text-6xl font-black tabular-nums tracking-tighter text-foreground">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
          <Button 
            variant="primary" 
            className="w-full h-16 text-lg rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 transition-all active:scale-95"
            onClick={toggleTimer}
          >
            {isActive ? <Pause className="mr-2" size={24} /> : <Play className="mr-2" size={24} />}
            {isActive ? 'Pause' : `Start ${MODES[mode].label}`}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={resetTimer}
          >
            <RotateCcw className="mr-2" size={18} />
            Reset Timer
          </Button>
        </div>
      </div>
    </div>
  );
}
