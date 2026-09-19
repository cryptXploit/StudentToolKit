import { useState, useEffect } from 'react';

import { db } from '@student-os/storage';
import { BookOpen, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Card, Button } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';
import { syncTranscriptToProfile } from '../../lib/sync';
import { Link } from 'react-router-dom';

function generateSafeId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function TranscriptScreen() {
  const [newSemesterName, setNewSemesterName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [semesters, setSemesters] = useState<any[] | undefined>(undefined);

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

  const handleAddSemester = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaveError(null);
    
    const nameToSave = newSemesterName.trim();
    
    if (!nameToSave) {
      alert("Input state is empty! The text isn't saving to React state.");
      return;
    }
    
    try {
      const putPromise = db.semesters.put({
        id: generateSafeId(),
        name: nameToSave,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("DATABASE HANGING: Dexie is not responding.")), 2000)
      );
      
      await Promise.race([putPromise, timeoutPromise]);
      setNewSemesterName('');
      hapticImpact('light');
      
      await fetchSemesters();
    } catch (error: any) {
      console.error("Failed to save semester:", error);
      setSaveError(error.message || "Unknown database error occurred.");
    }
  };

  const handleDeleteSemester = async (id: string) => {
    hapticImpact('medium');
    await db.transaction('rw', db.semesters, db.courses, async () => {
      await db.courses.where({ semesterId: id }).delete();
      await db.semesters.delete(id);
    });
    await syncTranscriptToProfile();
    await fetchSemesters();
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-foreground">Academic Transcript</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your semesters and grades.</p>
      </header>

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
          semesters.map(semester => (
            <Card key={semester.id} className="flex items-center justify-between p-1 overflow-hidden group">
              <Link to={`/transcript/${semester.id}`} className="flex-1 p-3 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors rounded-lg">
                <span className="font-semibold text-foreground">{semester.name}</span>
                <ChevronRight size={20} className="text-muted-foreground opacity-50" />
              </Link>
              <Button 
                variant="ghost" 
                className="p-3 text-muted-foreground hover:text-red-500 rounded-lg shrink-0" 
                onClick={() => handleDeleteSemester(semester.id)}
              >
                <Trash2 size={20} />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
