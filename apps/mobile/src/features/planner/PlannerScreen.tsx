import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { calculateDaysRemaining } from '@student-os/engine';
import { Calendar, Plus, Clock, CheckCircle2, Circle, Trash2, BookOpen } from 'lucide-react';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { scheduleEventReminder, cancelEventReminder } from '../../lib/notifications';
import { hapticImpact } from '../../lib/haptics';
import { generateSafeId } from '../../lib/id';
import { Card, Input, Select, Button } from '@student-os/ui';

export function PlannerScreen() {
  const events = useLiveQuery(async () => {
    const data = await db.events.toArray();
    return data.sort((a, b) => a.date - b.date);
  });
  
  const courses = useLiveQuery(async () => {
    const data = await db.courses.toArray();
    return data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  const activeEvents = events ? events.filter(e => !e.isCompleted && calculateDaysRemaining(e.date) >= -1) : [];

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [type, setType] = useState<'exam' | 'assignment'>('exam');
  const [courseId, setCourseId] = useState<string>('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateStr) return;
    
    const newId = generateSafeId();
    const eventDateMs = new Date(dateStr).getTime();

    await db.events.put({
      id: newId,
      title: title.trim(),
      date: eventDateMs,
      type,
      courseId: courseId || undefined,
      isCompleted: false,
      createdAt: Date.now()
    });
    
    // Schedule the local native notification
    await scheduleEventReminder(newId, title.trim(), eventDateMs, type);
    
    setTitle('');
    setDateStr('');
    setCourseId('');
    setIsAdding(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    hapticImpact(currentStatus ? 'light' : 'medium');
    
    if (!currentStatus) {
      // Event is being marked as completed, cancel the notification
      await cancelEventReminder(id);
    }
    
    await db.events.update(id, { isCompleted: !currentStatus });
  };

  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  const confirmDeleteEvent = async () => {
    if (!itemToDelete) return;
    hapticImpact('light');
    
    await cancelEventReminder(itemToDelete.id);
    await db.events.delete(itemToDelete.id);
    setItemToDelete(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Academic Timeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Deadlines and exams</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary/10 text-primary p-2.5 rounded-full active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-6 animate-in fade-in slide-in-from-top-4">
          <Card className="p-4 space-y-4">
            <Input 
              type="text" required placeholder="Event title (e.g. Database Midterm)"
              value={title} onChange={e => setTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input 
                type="date" required
                value={dateStr} onChange={e => setDateStr(e.target.value)}
              />
              <Select 
                value={type} onChange={e => setType(e.target.value as any)}
              >
                <option value="exam">Exam</option>
                <option value="assignment">Assignment</option>
              </Select>
            </div>
            
            <div className="pt-1">
              <Select 
                value={courseId} onChange={e => setCourseId(e.target.value)}
              >
                <option value="">General Event (No Course)</option>
                {courses?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="primary" className="flex-1 py-2">Add Event</Button>
              <Button type="button" variant="secondary" onClick={() => setIsAdding(false)} className="px-4 py-2">Cancel</Button>
            </div>
          </Card>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pb-6 space-y-3">
        {!Array.isArray(events) ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
          </div>
        ) : activeEvents.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center text-center h-40 text-muted-foreground">
            <Calendar className="mb-3 opacity-50" size={40} />
            <p className="font-medium">No upcoming events</p>
            <p className="text-sm">Enjoy your free time!</p>
          </div>
        ) : (
          activeEvents.map(event => {
            const daysLeft = calculateDaysRemaining(event.date);
            const isUrgent = daysLeft >= 0 && daysLeft <= 3;
            const isPast = daysLeft < 0;
            const eventCourse = courses?.find(c => c.id === event.courseId);

            return (
              <Card key={event.id} className="p-4 flex items-center">
                <button onClick={() => toggleStatus(event.id, event.isCompleted)} className="mr-4 text-muted-foreground hover:text-primary transition-colors">
                  {event.isCompleted ? <CheckCircle2 className="text-primary"/> : <Circle/>}
                </button>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground leading-tight">{event.title}</h3>
                  <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                    <span className="uppercase tracking-wider font-medium">{event.type}</span>
                    {eventCourse && (
                      <span className="flex items-center bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        <BookOpen size={10} className="mr-1" />
                        {eventCourse.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <div className={`text-right ${isUrgent ? 'text-red-500 font-bold' : isPast ? 'text-muted-foreground' : 'text-primary font-medium'}`}>
                    <div className="flex items-center justify-end">
                      <Clock className="mr-1" size={14} />
                      <span>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : daysLeft < 0 ? 'Overdue' : `${daysLeft} days`}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setItemToDelete({ id: event.id, name: event.title })} className="mt-2 text-slate-300 hover:text-red-500 transition-colors" title="Delete Event">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={itemToDelete !== null}
        itemName={itemToDelete?.name || ''}
        onConfirm={confirmDeleteEvent}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}

