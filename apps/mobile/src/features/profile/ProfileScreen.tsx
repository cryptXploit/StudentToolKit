import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { generateEcosystemBackup, restoreEcosystemBackup } from '../../lib/backup';
import { runOutOfBandFilesystemMigration } from '../../lib/filesystem';
import { GraduationCap, BookOpen, Target, Hash, Check, Download, Upload, Shield, RefreshCcw } from 'lucide-react';
import { Button, Card, Input, Label } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';
import { Link } from 'react-router-dom';

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { BellOff, BellRing } from 'lucide-react';

export function ProfileScreen() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const courseCount = useLiveQuery(() => db.courses.count());
  const isGpaAutoCalculated = (courseCount || 0) > 0;
  
  const [universityName, setUniversityName] = useState('');
  const [department, setDepartment] = useState('');
  const [maxScale, setMaxScale] = useState('4.00');
  const [targetCGPA, setTargetCGPA] = useState('');
  const [totalDegreeCredits, setTotalDegreeCredits] = useState('');
  const [currentCGPA, setCurrentCGPA] = useState('');
  const [totalCredits, setTotalCredits] = useState('');
  const [targetAttendance, setTargetAttendance] = useState('75');
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifyStatus, setNotifyStatus] = useState<string>('checking...');

  useEffect(() => {
    const checkNotificationPerms = async () => {
      if (!Capacitor.isNativePlatform()) {
        setNotifyStatus('unsupported');
        return;
      }
      try {
        const { display } = await LocalNotifications.checkPermissions();
        setNotifyStatus(display); // 'granted', 'denied', or 'prompt'
      } catch (e) {
        console.warn('Failed to check notification permissions', e);
        setNotifyStatus('error');
      }
    };
    checkNotificationPerms();
    
    // Also re-check when app is foregrounded if App plugin was used, but we'll stick to mount.
  }, []);

  useEffect(() => {
    if (profile) {
      setUniversityName(profile.universityName || '');
      setDepartment(profile.department || '');
      setMaxScale(profile.maxGradingScale?.toFixed(2) || '4.00');
      if (profile.targetCGPA) setTargetCGPA(profile.targetCGPA.toFixed(2));
      if (profile.totalDegreeCredits) setTotalDegreeCredits(profile.totalDegreeCredits.toString());
      if (profile.currentCGPA) setCurrentCGPA(profile.currentCGPA.toString());
      if (profile.totalCredits) setTotalCredits(profile.totalCredits.toString());
      if (profile.targetAttendancePercentage) setTargetAttendance(profile.targetAttendancePercentage.toString());
    }
  }, [profile]);

  const handleSave = async () => {
    const existingProfile = await db.profile.get('me');
    
    await db.profile.put({
      id: 'me',
      activeSemesterId: existingProfile?.activeSemesterId,
      universityName: universityName.trim(),
      department: department.trim(),
      maxGradingScale: parseFloat(maxScale) || 4.0,
      targetCGPA: targetCGPA ? parseFloat(targetCGPA) : undefined,
      totalDegreeCredits: totalDegreeCredits ? parseFloat(totalDegreeCredits) : undefined,
      currentCGPA: isGpaAutoCalculated ? existingProfile?.currentCGPA : (currentCGPA ? parseFloat(currentCGPA) : undefined),
      totalCredits: isGpaAutoCalculated ? existingProfile?.totalCredits : (totalCredits ? parseFloat(totalCredits) : undefined),
      targetAttendancePercentage: targetAttendance ? parseFloat(targetAttendance) : 75,
      updatedAt: Date.now(),
    });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExport = async () => {
    try {
      hapticImpact('light');
      await generateEcosystemBackup();
    } catch (e) {
      alert('Failed to export data.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('WARNING: This will permanently overwrite all your current data. Are you sure?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      await restoreEcosystemBackup(file);
      hapticImpact('medium');
      alert('Ecosystem restored successfully! Please restart the app or navigate to Home.');
      window.location.reload(); // Force reload to re-mount live queries
    } catch (err) {
      console.error(err);
      alert('Failed to restore data. Invalid backup file.');
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      await runOutOfBandFilesystemMigration();
      hapticImpact('medium');
    } catch (e) {
      console.error(e);
      alert('Failed to sync storage.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      <header className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-foreground">Academic Profile</h1>
        <p className="text-muted-foreground text-sm mt-1 mb-3">Set your context for accurate calculations.</p>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 flex items-start">
          <Shield className="mr-2 mt-0.5 shrink-0" size={16} />
          <p className="text-xs leading-relaxed opacity-90">
            Your data never leaves this device. We use this context to provide smarter default values in your calculators.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {/* Basic Info */}
        <Card className="p-4 space-y-4">
          <div>
            <Label>
              <GraduationCap className="mr-2 text-primary" size={16} />
              University Name
            </Label>
            <Input
              type="text"
              placeholder="e.g. Rajshahi University"
              value={universityName}
              onChange={(e) => setUniversityName(e.target.value)}
            />
          </div>
          <div>
            <Label>
              <BookOpen className="mr-2 text-primary" size={16} />
              Department
            </Label>
            <Input
              type="text"
              placeholder="e.g. ICE"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div className="pt-2">
            <Label>
              <Check className="mr-2 text-primary" size={16} />
              Target Attendance %
            </Label>
            <Input
              type="number" step="1" min="1" max="100"
              placeholder="e.g. 75" value={targetAttendance} onChange={(e) => setTargetAttendance(e.target.value)}
            />
          </div>
        </Card>

        {/* Grading Scale */}
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                <Hash className="mr-2 text-primary" size={16} />
                Max Scale
              </Label>
              <Input
                type="number" step="0.01" min="1.0" max="10.0"
                value={maxScale} onChange={(e) => setMaxScale(e.target.value)}
              />
            </div>
            <div>
              <Label>
                <Target className="mr-2 text-primary" size={16} />
                Target CGPA
              </Label>
              <Input
                type="number" step="0.01" min="1.0" max="10.0"
                placeholder="e.g. 3.50" value={targetCGPA} onChange={(e) => setTargetCGPA(e.target.value)}
              />
            </div>
          </div>
          <div className="pt-2">
            <Label>
              <GraduationCap className="mr-2 text-primary" size={16} />
              Total Degree Credits
            </Label>
            <Input
              type="number" step="0.5" min="1" max="300"
              placeholder="e.g. 130" value={totalDegreeCredits} onChange={(e) => setTotalDegreeCredits(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                <Hash className="mr-2 text-primary" size={16} />
                Current CGPA
              </Label>
              <Input
                type="number" step="0.01" min="0" max="10.0"
                placeholder="e.g. 3.20" value={currentCGPA} onChange={(e) => setCurrentCGPA(e.target.value)}
                disabled={isGpaAutoCalculated}
                className={isGpaAutoCalculated ? "opacity-60 bg-slate-50 dark:bg-slate-900 cursor-not-allowed" : ""}
              />
            </div>
            <div>
              <Label>
                <Hash className="mr-2 text-primary" size={16} />
                Total Credits
              </Label>
              <Input
                type="number" step="0.5" min="0"
                placeholder="e.g. 90" value={totalCredits} onChange={(e) => setTotalCredits(e.target.value)}
                disabled={isGpaAutoCalculated}
                className={isGpaAutoCalculated ? "opacity-60 bg-slate-50 dark:bg-slate-900 cursor-not-allowed" : ""}
              />
            </div>
          </div>
          {isGpaAutoCalculated && (
            <p className="text-xs text-muted-foreground mt-2">
              🔒 Your CGPA and Total Credits are automatically calculated from your Memory/Transcript.
            </p>
          )}
        </Card>
      </div>

      <Button
        onClick={handleSave}
        variant="primary"
        className="mt-6 w-full py-3"
      >
        {isSaved ? <><Check className="mr-2" size={20} />Saved Locally</> : 'Save Profile'}
      </Button>

      {/* App Settings & Notifications Section */}
      <section className="mt-8 space-y-3">
        <Card className="flex flex-col p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-foreground">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg mr-3">
                {notifyStatus === 'granted' ? (
                  <BellRing className="text-emerald-500" size={20} />
                ) : (
                  <BellOff className="text-red-500" size={20} />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">System Notifications</h3>
                <p className="text-xs text-muted-foreground">Class and Exam Alerts</p>
              </div>
            </div>
            <div className="flex items-center">
              {notifyStatus === 'checking...' ? (
                <span className="text-xs text-muted-foreground">Checking...</span>
              ) : notifyStatus === 'granted' ? (
                <span className="text-xs font-semibold text-emerald-500 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">Active</span>
              ) : notifyStatus === 'unsupported' ? (
                <span className="text-xs text-muted-foreground">N/A</span>
              ) : (
                <span className="text-xs font-semibold text-red-500 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-md">Disabled</span>
              )}
            </div>
          </div>
          
          {(notifyStatus === 'denied' || notifyStatus === 'prompt' || notifyStatus === 'prompt-with-rationale') && (
            <div className="mt-3 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg leading-relaxed">
              Reminders are disabled. Please enable notifications in your Android Settings to receive class and exam alerts.
            </div>
          )}
        </Card>

        <Link to="/settings" className="block">
          <Card className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
            <div className="flex items-center text-foreground">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings text-muted-foreground"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm">App Settings</h3>
                <p className="text-xs text-muted-foreground">Theme, Appearance & Preferences</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right text-muted-foreground opacity-50"><path d="m9 18 6-6-6-6"/></svg>
          </Card>
        </Link>
      </section>

      {/* Data Vault Section */}
      <section className="mt-10 mb-8 border-t border-slate-200 dark:border-slate-800 pt-8">
        <div className="flex items-center justify-center mb-4 text-muted-foreground">
          <Shield className="mr-1.5" size={16} />
          <h2 className="text-xs font-semibold uppercase tracking-wider">Offline Data Vault</h2>
        </div>
        <p className="text-center text-xs text-muted-foreground mb-4 px-4 leading-relaxed">
          Your data is stored securely on your device. Export a backup before uninstalling or moving to a new phone.
        </p>
        
        <div className="flex gap-3 mb-6">
          <Button onClick={handleExport} variant="secondary" className="flex-1 py-2.5 text-sm">
            <Download className="mr-2 text-primary" size={16} />
            Export
          </Button>
          
          <input type="file" accept=".zip" className="hidden" ref={fileInputRef} onChange={handleImport} />
          
          <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="flex-1 py-2.5 text-sm">
            <Upload className="mr-2 text-primary" size={16} />
            Restore
          </Button>
        </div>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex flex-col items-center text-center">
            <h3 className="font-semibold text-sm mb-1">Advanced Storage</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Moves legacy documents to optimized local storage.
            </p>
            <Button 
              variant="secondary" 
              onClick={handleForceSync} 
              disabled={isSyncing}
              className="w-full py-2.5 text-sm font-medium"
            >
              {isSyncing ? (
                <><RefreshCcw className="mr-2 animate-spin text-primary" size={16} /> Syncing...</>
              ) : (
                <><RefreshCcw className="mr-2 text-primary" size={16} /> Force Storage Sync</>
              )}
            </Button>
          </div>
        </Card>
      </section>

      {/* Legal & Version Footer */}
      <footer className="mt-8 mb-4 text-center">
        <p className="text-sm text-muted-foreground">Student OS v1.0.0</p>
        <p className="text-xs text-muted-foreground mt-1">
          <a href="https://studentos.app/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">
            Privacy Policy
          </a>
        </p>
      </footer>
    </div>
  );
}
