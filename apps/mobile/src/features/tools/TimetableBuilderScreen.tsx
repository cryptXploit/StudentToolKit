import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Tag, Trash2, CalendarX, Plus } from 'lucide-react';
import { Card, Input, Label, Button } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';

function generateSafeId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 }
];

const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TimetableBuilderScreen() {
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay());

  const profile = useLiveQuery(() => db.profile.get('me'));
  const allCourses = useLiveQuery(() => db.courses.toArray()) || [];
  
  const activeCourses = useMemo(() => {
    return allCourses.filter(c => c.semesterId === profile?.activeSemesterId);
  }, [allCourses, profile?.activeSemesterId]);

  const allSlots = useLiveQuery(() => db.routine.toArray()) || [];
  
  const daySlots = useMemo(() => {
    return allSlots
      .filter(s => s.dayOfWeek === activeDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allSlots, activeDay]);

  // Form state
  const [courseId, setCourseId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [type, setType] = useState('Lecture');

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !startTime || !endTime) return;

    try {
      await db.routine.put({
        id: generateSafeId(),
        courseId,
        dayOfWeek: activeDay,
        startTime,
        endTime,
        roomNumber,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      hapticImpact('light');
      
      setCourseId('');
      setStartTime('');
      setEndTime('');
      setRoomNumber('');
      setType('Lecture');
    } catch (err) {
      console.error('Failed to add routine slot', err);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      hapticImpact('medium');
      await db.routine.delete(id);
    } catch (err) {
      console.error('Failed to delete routine slot', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col min-h-full">
      <header className="mb-6 mt-2 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Timetable Builder</h1>
          <p className="text-muted-foreground text-sm">Organize your weekly routine.</p>
        </div>
      </header>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 overflow-x-auto hide-scrollbar">
        {DAYS.map(day => (
          <button
            key={day.value}
            onClick={() => { hapticImpact('light'); setActiveDay(day.value); }}
            className={`flex-1 min-w-[3rem] py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeDay === day.value 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                : 'text-muted-foreground'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 mb-6">
        {daySlots.length === 0 ? (
          <Card className="p-6 text-center flex flex-col items-center justify-center opacity-70">
            <CalendarX className="text-muted-foreground mb-3" size={32} />
            <p className="text-sm text-muted-foreground">
              No classes on {FULL_DAYS[activeDay]}! Enjoy your day off.
            </p>
          </Card>
        ) : (
          daySlots.map(slot => {
            const course = allCourses.find(c => c.id === slot.courseId);
            return (
              <Card key={slot.id} className="p-4 border-l-4 border-l-primary flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-foreground mb-1">
                    {course?.name || 'Unknown Course'}
                  </h3>
                  <div className="flex flex-col space-y-1 mt-2">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <Clock size={14} className="mr-2 opacity-70" />
                      {slot.startTime} - {slot.endTime}
                    </div>
                    {slot.roomNumber && (
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <MapPin size={14} className="mr-2 opacity-70" />
                        {slot.roomNumber}
                      </div>
                    )}
                    {slot.type && (
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Tag size={14} className="mr-2 opacity-70" />
                        {slot.type}
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="p-2 -mr-2 text-muted-foreground hover:text-red-500 rounded-xl shrink-0"
                  onClick={() => handleDeleteSlot(slot.id)}
                >
                  <Trash2 size={18} />
                </Button>
              </Card>
            );
          })
        )}
      </div>

      <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-foreground mb-4">Add Class to {FULL_DAYS[activeDay]}</h3>
        <form onSubmit={handleAddSlot} className="space-y-4">
          <div>
            <Label className="text-xs mb-1 text-muted-foreground block">Course</Label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
            >
              <option value="" disabled>Select a course</option>
              {activeCourses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 text-muted-foreground">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-xs mb-1 text-muted-foreground">End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 text-muted-foreground">Location (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. Room 302"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 text-muted-foreground block">Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-foreground"
              >
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Seminar">Seminar</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            disabled={!courseId || !startTime || !endTime}
            className="w-full mt-2"
          >
            <Plus size={18} className="mr-2" /> Add Class
          </Button>
        </form>
      </Card>
    </div>
  );
}
