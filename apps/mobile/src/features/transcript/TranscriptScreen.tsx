import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { BookOpen, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Card, Input, Button } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';
import { syncTranscriptToProfile } from '../../lib/sync';
import { Link } from 'react-router-dom';

export function TranscriptScreen() {
  const [newSemesterName, setNewSemesterName] = useState('');

  const semesters = useLiveQuery(() => 
    db.semesters.orderBy('createdAt').toArray()
  );

  const handleAddSemester = async () => {
    if (!newSemesterName.trim()) return;

    await db.semesters.put({
      id: crypto.randomUUID(),
      name: newSemesterName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setNewSemesterName('');
    hapticImpact('light');
  };

  const handleDeleteSemester = async (id: string) => {
    hapticImpact('medium');
    await db.transaction('rw', db.semesters, db.courses, async () => {
      await db.courses.where({ semesterId: id }).delete();
      await db.semesters.delete(id);
    });
    await syncTranscriptToProfile();
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-foreground">Academic Transcript</h1>
        <p className="text-muted text-sm mt-1">Manage your semesters and grades.</p>
      </header>

      <div className="flex gap-2 mb-6">
        <Input 
          placeholder="Semester Name (e.g., Fall 2026)" 
          value={newSemesterName} 
          onChange={(e) => setNewSemesterName(e.target.value)} 
          className="flex-1"
        />
        <Button 
          variant="primary" 
          onClick={handleAddSemester} 
          disabled={!newSemesterName.trim()}
          className="px-4"
        >
          <Plus size={20} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-6">
        {semesters === undefined ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
          </div>
        ) : semesters.length === 0 ? (
          <Card className="p-6 text-center flex flex-col items-center justify-center h-48 opacity-70">
            <BookOpen className="text-muted mb-3" size={32} />
            <p className="text-sm text-muted">You haven't added any semesters yet. Build your academic memory by adding your first one above.</p>
          </Card>
        ) : (
          semesters.map(semester => (
            <Card key={semester.id} className="flex items-center justify-between p-1 overflow-hidden group">
              <Link to={`/transcript/${semester.id}`} className="flex-1 p-3 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors rounded-lg">
                <span className="font-semibold text-foreground">{semester.name}</span>
                <ChevronRight size={20} className="text-muted opacity-50" />
              </Link>
              <Button 
                variant="ghost" 
                className="p-3 text-slate-400 hover:text-red-500 rounded-lg shrink-0" 
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
