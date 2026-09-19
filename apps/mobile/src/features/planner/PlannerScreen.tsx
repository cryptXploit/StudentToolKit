import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { calculateDaysRemaining } from '@student-os/engine';
import { Calendar, Plus, Clock, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { scheduleEventReminder, cancelEventReminder } from '../../lib/notifications';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Card, Input, Select, Button } from '@student-os/ui';

export function PlannerScreen() {
  const events = useLiveQuery(() => db.events.orderBy('date').toArray()) || [];
  const activeEvents = events.filter(e => !e.isCompleted && calculateDaysRemaining(e.date) >= -1);

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [type, setType] = useState<'exam' | 'assignment'>('exam');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateStr) return;
    
    const newId = crypto.randomUUID();
    const eventDateMs = new Date(dateStr).getTime();

    await db.events.put({
      id: newId,
      title: title.trim(),
      date: eventDateMs,
      type,
      isCompleted: false,
      createdAt: Date.now()
    });
    
    // Schedule the local native notification
    await scheduleEventReminder(newId, title.trim(), eventDateMs, type);
    
    setTitle('');
    setDateStr('');
    setIsAdding(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: currentStatus ? ImpactStyle.Light : ImpactStyle.Medium }).catch(() => {});
    }
    
    if (!currentStatus) {
      // Event is being marked as completed, cancel the notification
      await cancelEventReminder(id);
    }
    
    await db.events.update(id, { isCompleted: !currentStatus });
  };

  const handleDelete = async (id: string) => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    
    await cancelEventReminder(id);
    await db.events.delete(id);
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Academic Timeline</h1>
          <p className="text-muted text-sm mt-1">Deadlines and exams</p>
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
            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="primary" className="flex-1 py-2">Add Event</Button>
              <Button type="button" variant="secondary" onClick={() => setIsAdding(false)} className="px-4 py-2">Cancel</Button>
            </div>
          </Card>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pb-6 space-y-3">
        {activeEvents.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center text-center h-40 text-muted">
            <Calendar className="mb-3 opacity-50" size={40} />
            <p className="font-medium">No upcoming events</p>
            <p className="text-sm">Enjoy your free time!</p>
          </div>
        ) : (
          activeEvents.map(event => {
            const daysLeft = calculateDaysRemaining(event.date);
            const isUrgent = daysLeft >= 0 && daysLeft <= 3;
            const isPast = daysLeft < 0;

            return (
              <Card key={event.id} className="p-4 flex items-center">
                <button onClick={() => toggleStatus(event.id, event.isCompleted)} className="mr-4 text-slate-400 hover:text-primary transition-colors">
                  {event.isCompleted ? <CheckCircle2 className="text-primary"/> : <Circle/>}
                </button>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground leading-tight">{event.title}</h3>
                  <p className="text-xs text-muted mt-1 uppercase tracking-wider">{event.type}</p>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <div className={`text-right ${isUrgent ? 'text-red-500 font-bold' : isPast ? 'text-slate-400' : 'text-primary font-medium'}`}>
                    <div className="flex items-center justify-end">
                      <Clock className="mr-1" size={14} />
                      <span>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : daysLeft < 0 ? 'Overdue' : `${daysLeft} days`}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(event.id)} className="mt-2 text-slate-300 hover:text-red-500 transition-colors" title="Delete Event">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
