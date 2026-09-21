import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { calculateDaysRemaining } from '@student-os/engine';
import { Calendar, Plus, Clock, CheckCircle2, Circle, Trash2, BookOpen } from 'lucide-react';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { scheduleEventReminder, cancelEventReminder } from '../../lib/notifications';
import { hapticImpact } from '../../lib/haptics';
import { generateSafeId } from '../../lib/id';
import { Card, Input, Select, Button } from '@student-os/ui';

interface TimelineItem {
  id: string;
  type: 'class' | 'exam' | 'assignment' | 'other';
  title: string;
  subtitle: string;
  absoluteDateMs: number;
  courseId?: string;
  isCompleted?: boolean;
}

export function PlannerScreen() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks'>('timeline');

  const events = useLiveQuery(async () => {
    const data = await db.events.toArray();
    return data.sort((a, b) => a.date - b.date);
  });
  
  const courses = useLiveQuery(async () => {
    const data = await db.courses.toArray();
    return data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  const routines = useLiveQuery(async () => {
    return await db.routine.toArray();
  });

  const activeEvents = events ? events.filter(e => calculateDaysRemaining(e.date) >= -1).sort((a, b) => { if (a.isCompleted === b.isCompleted) return a.date - b.date; return a.isCompleted ? 1 : -1; }) : [];

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
    
    await scheduleEventReminder(newId, title.trim(), eventDateMs, type);
    
    setTitle('');
    setDateStr('');
    setCourseId('');
    setIsAdding(false);
  };

  const toggleStatus = async (event: any) => {
    const currentStatus = event.isCompleted;
    hapticImpact(currentStatus ? 'light' : 'medium');
    if (!currentStatus) {
      await cancelEventReminder(event.id);
    } else {
      await scheduleEventReminder(event.id, event.title, event.date, event.type);
    }
    await db.events.update(event.id, { isCompleted: !currentStatus });
  };

  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  const confirmDeleteEvent = async () => {
    if (!itemToDelete) return;
    hapticImpact('light');
    
    await cancelEventReminder(itemToDelete.id);
    await db.events.delete(itemToDelete.id);
    setItemToDelete(null);
  };

  const timelineProjection = useMemo(() => {
    if (!routines || !events || !courses) return null;

    const items: TimelineItem[] = [];
    
    // Set 'today' exactly at 00:00:00
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Project 7 days forward
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() + i);
      const currentDayOfWeek = currentDay.getDay();

      routines.forEach(slot => {
        if (slot.dayOfWeek === currentDayOfWeek) {
          const [hours, minutes] = slot.startTime.split(':');
          const slotDate = new Date(currentDay);
          slotDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          
          const course = courses.find(c => c.id === slot.courseId);
          
          items.push({
            id: `${slot.id}-${slotDate.getTime()}`,
            type: 'class',
            title: course ? course.name : 'Class',
            subtitle: `${slot.startTime} - ${slot.endTime} ${slot.roomNumber ? `� ${slot.roomNumber}` : ''}`,
            absoluteDateMs: slotDate.getTime(),
            courseId: slot.courseId,
          });
        }
      });
    }

    const sevenDaysFromNowMs = today.getTime() + (7 * 24 * 60 * 60 * 1000);
    const windowEvents = events.filter(e => e.date >= today.getTime() && e.date < sevenDaysFromNowMs);
    
    windowEvents.forEach(e => {
      const course = courses.find(c => c.id === e.courseId);
      items.push({
        id: e.id,
        type: e.type,
        title: e.title,
        subtitle: course ? course.name : 'General Task',
        absoluteDateMs: e.date,
        courseId: e.courseId,
        isCompleted: e.isCompleted,
      });
    });

    return items.sort((a, b) => a.absoluteDateMs - b.absoluteDateMs);
  }, [routines, events, courses]);

  function getDayLabel(dateMs: number) {
    const diff = calculateDaysRemaining(dateMs);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    const d = new Date(dateMs);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  const groupedTimeline = useMemo(() => {
    if (!timelineProjection) return null;
    const groups: { label: string; items: TimelineItem[] }[] = [];
    let currentLabel = '';
    
    timelineProjection.forEach(item => {
      const label = getDayLabel(item.absoluteDateMs);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    });
    return groups;
  }, [timelineProjection]);

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col">
      <header className="mb-4 mt-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Academic Timeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Unified schedule & tasks</p>
        </div>
        {activeTab === 'tasks' && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-primary/10 text-primary p-2.5 rounded-full active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        )}
      </header>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6 shrink-0">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'timeline' ? 'bg-white dark:bg-slate-700 shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'tasks' ? 'bg-white dark:bg-slate-700 shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Tasks
        </button>
      </div>

      {activeTab === 'tasks' && isAdding && (
        <form onSubmit={handleAdd} className="mb-6 animate-in fade-in slide-in-from-top-4 shrink-0">
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
        {activeTab === 'timeline' ? (
          !groupedTimeline ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
            </div>
          ) : groupedTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-40 text-muted-foreground">
              <Calendar className="mb-3 opacity-50" size={40} />
              <p className="font-medium">No classes or tasks ahead</p>
              <p className="text-sm">Enjoy your free time!</p>
            </div>
          ) : (
            groupedTimeline.map((group, idx) => (
              <div key={idx} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                  {group.label}
                </h3>
                <div className="space-y-3">
                  {group.items.map(item => {
                    const isClass = item.type === 'class';
                    return (
                      <Card key={item.id} className={`p-4 flex flex-col relative overflow-hidden ${!isClass ? 'border-primary/30' : ''}`}>
                        {!isClass && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        )}
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-foreground leading-tight">{item.title}</h4>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isClass ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-primary/10 text-primary'}`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">{item.subtitle}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )
        ) : (
          !Array.isArray(events) ? (
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
                  <button onClick={() => toggleStatus(event)} className="mr-4 text-muted-foreground hover:text-primary transition-colors">
                    {event.isCompleted ? <CheckCircle2 className="text-primary"/> : <Circle/>}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-semibold leading-tight ${event.isCompleted ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}>{event.title}</h3>
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
          )
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



