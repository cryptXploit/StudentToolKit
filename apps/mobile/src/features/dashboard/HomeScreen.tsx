import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, CheckSquare, Target, GraduationCap, Clock, Calendar } from 'lucide-react';
import { Card, Button } from '@student-os/ui';
import { calculateDaysRemaining } from '@student-os/engine';

export function HomeScreen() {
  const navigate = useNavigate();
  const profile = useLiveQuery(() => db.profile.get('me'));
  
  const nextEvent = useLiveQuery(() => {
    return db.events.orderBy('date').toArray().then(events => 
      events.find(e => !e.isCompleted && calculateDaysRemaining(e.date) >= -1)
    );
  });

  const [greeting, setGreeting] = useState('Welcome');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    setDateString(new Date().toLocaleDateString(undefined, options));
  }, []);

  const quickActions = [
    { label: 'Target GPA', icon: Target, path: '/tools/target-gpa', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Attendance', icon: CheckSquare, path: '/tools/attendance', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'All Tools', icon: Calculator, path: '/tools', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-full">
      <header className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
        <p className="text-muted text-sm mt-1">{dateString}</p>
      </header>

      {/* Academic Snapshot */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Academic Snapshot</h2>
        </div>
        
        {!profile ? (
          <Card className="p-6">
            <h3 className="text-xl font-bold text-foreground mb-2">Welcome to Student OS</h3>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              Your offline academic decision engine. All calculations happen instantly and securely on this device.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/tools/target-gpa')} variant="primary" className="w-full py-2.5">
                Run a Calculation
              </Button>
              <Button onClick={() => navigate('/profile')} variant="secondary" className="w-full py-2.5">
                Set up Academic Profile
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <div className="flex items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
              <div className="bg-primary/10 p-2.5 rounded-xl mr-3">
                <GraduationCap className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground leading-tight">
                  {profile.universityName || 'University Not Set'}
                </h3>
                <p className="text-sm text-muted">
                  {profile.department || 'Department Not Set'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {profile.currentCGPA !== undefined && (
                <div>
                  <p className="text-xs font-medium text-muted mb-1">Current CGPA</p>
                  <p className="text-2xl font-bold text-primary">
                    {profile.currentCGPA.toFixed(2)}
                    <span className="text-sm font-normal text-muted ml-1">({profile.totalCredits} Cr)</span>
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted mb-1">Target CGPA</p>
                <p className="text-2xl font-bold text-foreground">
                  {profile.targetCGPA ? profile.targetCGPA.toFixed(2) : '--'}
                  <span className="text-sm font-normal text-muted ml-1">/ {profile.maxGradingScale.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.path} className="active:scale-[0.95] transition-transform">
                <Card className="p-3 flex flex-col items-center justify-center text-center h-full">
                  <div className={`p-2 rounded-lg mb-2 ${action.bg}`}>
                    <Icon className={action.color} size={20} />
                  </div>
                  <span className="text-[11px] font-medium text-foreground leading-tight">{action.label}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
      
      {/* Up Next Section */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase mb-3">Up Next</h2>
        
        {nextEvent !== undefined ? (
          nextEvent ? (
            <Link to="/planner" className="block active:scale-[0.98] transition-transform">
              <Card className="flex items-center justify-between p-4 border-l-4 border-l-primary">
                <div>
                  <h3 className="font-semibold text-foreground leading-tight">{nextEvent.title}</h3>
                  <p className="text-xs text-muted mt-1 uppercase tracking-wider">{nextEvent.type}</p>
                </div>
                <div className="text-right">
                  {(() => {
                    const daysLeft = calculateDaysRemaining(nextEvent.date);
                    const isUrgent = daysLeft >= 0 && daysLeft <= 3;
                    return (
                      <div className={`flex items-center justify-end ${isUrgent ? 'text-red-500 font-bold' : 'text-primary font-medium'}`}>
                        <Clock className="mr-1" size={14} />
                        <span>
                          {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </Card>
            </Link>
          ) : (
            <Card className="p-5 text-center flex flex-col items-center justify-center">
              <Calendar className="text-muted mb-2 opacity-50" size={32} />
              <h3 className="font-medium text-foreground mb-1">Your schedule is clear</h3>
              <p className="text-sm text-muted mb-4">Enjoy your free time!</p>
              <Button variant="secondary" onClick={() => navigate('/planner')} className="px-6 py-2 text-sm">
                Open Planner
              </Button>
            </Card>
          )
        ) : (
          <Card className="p-5 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
          </Card>
        )}
      </section>
    </div>
  );
}
