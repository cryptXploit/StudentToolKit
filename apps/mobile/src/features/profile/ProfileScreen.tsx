import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, exportVaultData, importVaultData } from '@student-os/storage';
import { GraduationCap, BookOpen, Target, Hash, Check, Download, Upload, Shield } from 'lucide-react';

export function ProfileScreen() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  
  const [universityName, setUniversityName] = useState('');
  const [department, setDepartment] = useState('');
  const [maxScale, setMaxScale] = useState('4.00');
  const [targetCGPA, setTargetCGPA] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setUniversityName(profile.universityName || '');
      setDepartment(profile.department || '');
      setMaxScale(profile.maxGradingScale?.toFixed(2) || '4.00');
      if (profile.targetCGPA) setTargetCGPA(profile.targetCGPA.toFixed(2));
    }
  }, [profile]);

  const handleSave = async () => {
    await db.profile.put({
      id: 'me',
      universityName: universityName.trim(),
      department: department.trim(),
      maxGradingScale: parseFloat(maxScale) || 4.0,
      targetCGPA: targetCGPA ? parseFloat(targetCGPA) : undefined,
      updatedAt: Date.now(),
    });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExport = async () => {
    try {
      const data = await exportVaultData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export data.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await importVaultData(event.target?.result as string);
        alert('Data restored successfully!');
        window.location.reload(); // Force reload to re-mount live queries
      } catch (err) {
        alert('Failed to restore data. Invalid file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      <header className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-foreground">Academic Profile</h1>
        <p className="text-muted text-sm mt-1">Set your context for accurate calculations.</p>
      </header>

      <div className="space-y-4">
        {/* Basic Info */}
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-foreground mb-1.5">
              <GraduationCap className="mr-2 text-primary" size={16} />
              University Name
            </label>
            <input
              type="text"
              className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. Rajshahi University"
              value={universityName}
              onChange={(e) => setUniversityName(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-foreground mb-1.5">
              <BookOpen className="mr-2 text-primary" size={16} />
              Department
            </label>
            <input
              type="text"
              className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. ICE"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
        </div>

        {/* Grading Scale */}
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-foreground mb-1.5">
                <Hash className="mr-2 text-primary" size={16} />
                Max Scale
              </label>
              <input
                type="number" step="0.01" min="1.0" max="10.0"
                className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
                value={maxScale} onChange={(e) => setMaxScale(e.target.value)}
              />
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-foreground mb-1.5">
                <Target className="mr-2 text-primary" size={16} />
                Target CGPA
              </label>
              <input
                type="number" step="0.01" min="1.0" max="10.0"
                className="w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. 3.50" value={targetCGPA} onChange={(e) => setTargetCGPA(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-6 w-full bg-primary text-white font-medium rounded-xl py-3 flex items-center justify-center active:scale-[0.98] transition-transform"
      >
        {isSaved ? <><Check className="mr-2" size={20} />Saved Locally</> : 'Save Profile'}
      </button>

      {/* Data Vault Section */}
      <section className="mt-10 mb-8 border-t border-slate-200 dark:border-slate-800 pt-8">
        <div className="flex items-center justify-center mb-4 text-muted">
          <Shield className="mr-1.5" size={16} />
          <h2 className="text-xs font-semibold uppercase tracking-wider">Offline Data Vault</h2>
        </div>
        <p className="text-center text-xs text-muted mb-4 px-4 leading-relaxed">
          Your data is stored securely on your device. Export a backup before uninstalling or moving to a new phone.
        </p>
        
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center bg-card border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 text-sm font-medium text-foreground active:scale-95 transition-transform">
            <Download className="mr-2 text-primary" size={16} />
            Export
          </button>
          
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
          
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center bg-card border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 text-sm font-medium text-foreground active:scale-95 transition-transform">
            <Upload className="mr-2 text-primary" size={16} />
            Restore
          </button>
        </div>
      </section>
    </div>
  );
}
