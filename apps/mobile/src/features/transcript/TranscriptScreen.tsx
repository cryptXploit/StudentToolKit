import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@student-os/storage';
import { BookOpen, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Card, Button } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';
import { syncTranscriptToProfile } from '../../lib/sync';
import { deleteSemesterCascade } from '../../lib/cascade';
import { Link } from 'react-router-dom';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

function generateSafeId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function TranscriptScreen() {
  const [newSemesterName, setNewSemesterName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [semesters, setSemesters] = useState<any[] | undefined>(undefined);
  
  const profile = useLiveQuery(() => db.profile.get('me'));

  const fetchSemesters = async () => {
    try {
      if (!db || typeof db.semesters === 'undefined') return;
      const data = await db.semesters.toArray();
      // Sort natively in JS to avoid Dexie index SchemaErrors
      data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setSemesters(data);
    } catch (error) {
      console.error("Dexie Fetch Error:", error);
      setSemesters([]);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleSetActive = async (id: string, e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    e?.stopPropagation();
    try {
      const existingProfile = await db.profile.get('me');
      await db.profile.put({
        ...(existingProfile || { id: 'me', maxGradingScale: 4.0, updatedAt: Date.now() }),
        activeSemesterId: id,
        updatedAt: Date.now()
      });
      hapticImpact('light');
    } catch (err) {
      console.error("Failed to set active semester:", err);
    }
  };

  const handleAddSemester = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaveError(null);
    
    const nameToSave = newSemesterName.trim();
    
    if (!nameToSave) {
      alert("Input state is empty! The text isn't saving to React state.");
      return;
    }
    
    try {
      const safeId = generateSafeId();
      const putPromise = db.semesters.put({
        id: safeId,
        name: nameToSave,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("DATABASE HANGING: Dexie is not responding.")), 2000)
      );
      
      await Promise.race([putPromise, timeoutPromise]);
      
      // Auto-fallback for first semester
      if (semesters?.length === 0) {
        await handleSetActive(safeId);
      }
      
      setNewSemesterName('');
      hapticImpact('light');
      
      await fetchSemesters();
    } catch (error: any) {
      console.error("Failed to save semester:", error);
      setSaveError(error.message || "Unknown database error occurred.");
    }
  };

  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  const confirmDeleteSemester = async () => {
    if (!itemToDelete) return;
    
    hapticImpact('medium');
    await deleteSemesterCascade(itemToDelete.id);
    await syncTranscriptToProfile();
    await fetchSemesters();
    
    // Auto-clear active semester if it was deleted
    if (profile?.activeSemesterId === itemToDelete.id) {
      try {
        const existingProfile = await db.profile.get('me');
        if (existingProfile) {
          await db.profile.put({
            ...existingProfile,
            activeSemesterId: undefined,
            updatedAt: Date.now()
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    setItemToDelete(null);
  };

  const renderForecaster = () => {
    if (!profile || typeof profile.targetCGPA !== 'number' || typeof profile.totalDegreeCredits !== 'number') {
      return null;
    }

    const { targetCGPA, totalDegreeCredits, currentCGPA = 0, totalCredits = 0, maxGradingScale = 4.0 } = profile;
    const creditsRemaining = totalDegreeCredits - totalCredits;
    
    if (creditsRemaining <= 0) {
      return (
        <Card className="p-4 mb-6 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Degree credits completed! You're done.</p>
        </Card>
      );
    }
    
    const requiredTotalPoints = targetCGPA * totalDegreeCredits;
    const currentTotalPoints = currentCGPA * totalCredits;
    const requiredGpa = (requiredTotalPoints - currentTotalPoints) / creditsRemaining;
    
    if (requiredGpa > maxGradingScale) {
      const maxAchievable = ((currentTotalPoints + (maxGradingScale * creditsRemaining)) / totalDegreeCredits).toFixed(2);
      return (
        <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-red-800 dark:text-red-400 mb-1">Target Tracker</h3>
          <p className="text-sm text-red-700 dark:text-red-300">Mathematically impossible. Max achievable is {maxAchievable}.</p>
        </Card>
      );
    }
    
    return (
      <Card className="p-4 mb-6 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">CGPA Forecaster</h3>
        <p className="text-sm text-foreground">
          You need to average a <span className="font-bold text-primary">{requiredGpa.toFixed(2)}</span> GPA over your remaining <span className="font-medium">{creditsRemaining}</span> credits to hit your <span className="font-medium">{targetCGPA.toFixed(2)}</span> target.
        </p>
      </Card>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-foreground">Academic Transcript</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your semesters and grades.</p>
      </header>

      {renderForecaster()}

      {saveError && <div className="text-red-500 text-sm mb-2">{saveError}</div>}
      <div className="flex gap-2 mb-6">
        <input 
          type="text"
          value={newSemesterName}
          onChange={(e) => setNewSemesterName(e.target.value)}
          placeholder="Semester Name (e.g. Fall 2026)"
          className="flex h-10 flex-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
        />
        <Button 
          type="button"
          variant="primary" 
          disabled={!newSemesterName.trim()}
          onClick={handleAddSemester}
          className="px-4 shrink-0"
        >
          <Plus size={20} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-6">
        {semesters === undefined || !Array.isArray(semesters) ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
          </div>
        ) : semesters.length === 0 ? (
          <Card className="p-6 text-center flex flex-col items-center justify-center h-48 opacity-70">
            <BookOpen className="text-muted-foreground mb-3" size={32} />
            <p className="text-sm text-muted-foreground">You haven't added any semesters yet. Build your academic memory by adding your first one above.</p>
          </Card>
        ) : (
          semesters.map(semester => {
            const isActive = profile?.activeSemesterId === semester.id;
            return (
            <Card key={semester.id} className={`flex items-center justify-between p-1 overflow-hidden group ${isActive ? 'border-primary border-l-4' : 'border-l-4 border-l-transparent'}`}>
              <Link to={`/transcript/${semester.id}`} className="flex-1 p-3 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors rounded-lg">
                <span className="font-semibold text-foreground">{semester.name}</span>
                <ChevronRight size={20} className="text-muted-foreground opacity-50" />
              </Link>
              <div className="flex items-center shrink-0 pr-1">
                {isActive ? (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider mr-2 px-2 py-1 bg-primary/10 rounded-md">Active</span>
                ) : (
                  <Button variant="ghost" className="text-xs font-medium text-muted-foreground px-2 h-8 mr-1" onClick={(e) => handleSetActive(semester.id, e)}>Set Active</Button>
                )}
                <Button 
                  variant="ghost" 
                  className="p-3 text-muted-foreground hover:text-red-500 rounded-xl"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setItemToDelete({ id: semester.id, name: semester.name });
                  }}
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            </Card>
          )})
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={itemToDelete !== null}
        itemName={itemToDelete?.name || ''}
        onConfirm={confirmDeleteSemester}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
