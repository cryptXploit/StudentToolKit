import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LocalNotifications } from "@capacitor/local-notifications";
import { ArrowLeft, Play, Pause, RotateCcw, Timer, Coffee, Moon, Shield, Video } from "lucide-react";
import { Button } from "@student-os/ui";
import { hapticImpact } from "../../lib/haptics";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@student-os/storage";
import { AdManager } from "../../lib/ads/AdManager";

const MODES = {
  focus: { label: "Focus", time: 25 * 60, icon: Timer },
  short: { label: "Short Break", time: 5 * 60, icon: Coffee },
  long: { label: "Long Break", time: 15 * 60, icon: Moon }
};

type Mode = keyof typeof MODES;
const NOTIF_ID = 8888;

export function PomodoroScreen() {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState<number>(MODES.focus.time);
  const [isActive, setIsActive] = useState(false);
  const [isRequestingAd, setIsRequestingAd] = useState(false);

  const profile = useLiveQuery(() => db.profile.get("me"));
  const isPassActive = profile?.focusPassExpiresAt ? profile.focusPassExpiresAt > Date.now() : false;

  const timerRef = useRef<any>(null);

  const handleUnlockPass = async () => {
    if (isRequestingAd || isPassActive) return;
    setIsRequestingAd(true);
    const success = await AdManager.showRewarded();
    if (success) {
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
      await db.profile.update("me", { focusPassExpiresAt: expiresAt });
      hapticImpact("heavy");
    }
    setIsRequestingAd(false);
  };

  const cancelNotification = async () => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
    } catch (e) {
      console.log("Failed to cancel notification", e);
    }
  };

  const scheduleNotification = async (seconds: number) => {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== "granted") return;
      }
      
      const targetTime = new Date(Date.now() + seconds * 1000);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIF_ID,
            title: "Timer Complete",
            body: `Your ${MODES[mode].label} session is finished.`,
            schedule: { at: targetTime },
            sound: "beep.wav",
            actionTypeId: "",
            extra: null
          }
        ]
      });
    } catch (e) {
      console.log("Failed to schedule notification", e);
    }
  };

  const toggleTimer = async () => {
    if (isActive) {
      hapticImpact("medium");
      setIsActive(false);
      await cancelNotification();
    } else {
      hapticImpact("heavy");
      setIsActive(true);
      if (timeLeft > 0) {
        await scheduleNotification(timeLeft);
      }
    }
  };

  const resetTimer = async () => {
    hapticImpact("light");
    setIsActive(false);
    setTimeLeft(MODES[mode].time);
    await cancelNotification();
  };

  const switchMode = async (newMode: Mode) => {
    if (newMode === mode) return;
    hapticImpact("light");
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
            hapticImpact("heavy");
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
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
                  ? "bg-white dark:bg-slate-700 shadow-sm text-primary" 
                  : "text-muted-foreground hover:text-foreground"
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
            {isActive ? "Pause" : `Start ${MODES[mode].label}`}
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
        
        <div className="w-full mt-12">
          {!isPassActive ? (
            <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold mb-1 text-slate-800 dark:text-slate-200">Need zero distractions?</h3>
              <p className="text-xs text-muted-foreground mb-4 text-center">Watch a quick ad to disable all banners and interruptions across the app for 24 hours.</p>
              <Button 
                variant="secondary" 
                className="w-full rounded-xl transition-all"
                onClick={handleUnlockPass} 
                disabled={isRequestingAd}
              >
                {isRequestingAd ? (
                  <span className="flex items-center"><div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mr-2" /> Loading...</span>
                ) : (
                  <span className="flex items-center"><Video className="mr-2 text-primary" size={18} /> Unlock 24h Ad-Free Focus Mode</span>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 p-6 rounded-3xl border border-green-100 dark:border-green-800/30">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center mb-3 text-green-600 dark:text-green-400">
                <Shield size={24} />
              </div>
              <h3 className="font-bold text-green-700 dark:text-green-400 mb-1">Focus Pass Active</h3>
              <p className="text-xs text-green-600/80 dark:text-green-500/80 text-center">All ads and interruptions are disabled.<br/>Happy studying!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
