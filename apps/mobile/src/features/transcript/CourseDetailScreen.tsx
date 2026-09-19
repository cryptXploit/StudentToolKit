import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { Card, Input, Button, Label } from '@student-os/ui';
import { ArrowLeft, Trash2, Plus, Clock, MapPin, AlertCircle } from 'lucide-react';
import { hapticImpact } from '../../lib/haptics';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CourseDetailScreen() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const course = useLiveQuery(() => 
    courseId ? db.courses.get(courseId) : undefined
  );

  const routineSlots = useLiveQuery(() => 
    courseId ? db.routine.where({ courseId }).toArray() : []
  ) || [];

  // Sort slots by day then by startTime
  const sortedSlots = [...routineSlots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    return a.startTime.localeCompare(b.startTime);
  });

  const handleAddRoutine = async () => {
    if (!courseId || !startTime || !endTime) return;

    await db.routine.put({
      id: crypto.randomUUID(),
      courseId,
      dayOfWeek: parseInt(dayOfWeek, 10),
      startTime,
      endTime,
      roomNumber: roomNumber.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setRoomNumber('');
    hapticImpact('light');
  };

  const handleDeleteRoutine = async (id: string) => {
    hapticImpact('medium');
    await db.routine.delete(id);
  };

  // Helper to format 24h to 12h for rendering
  const formatTime = (time24: string) => {
    const [h, m] = time24.split(':');
    if (!h || !m) return time24;
    const hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${m} ${suffix}`;
  };

  if (course === undefined) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (course === null) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-muted mb-4" />
        <h2 className="text-xl font-bold mb-2">Course Not Found</h2>
        <Button onClick={() => navigate(-1)} variant="secondary">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2 flex items-center">
        <Button variant="ghost" className="mr-2 p-2 -ml-2 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </Button>
        <div className="truncate">
          <h1 className="text-xl font-bold text-foreground truncate">{course.name || 'Unnamed Course'}</h1>
          <p className="text-muted text-sm mt-0.5">Timetable Builder</p>
        </div>
      </header>

      <Card className="p-4 mb-6 space-y-4">
        <div>
          <Label className="text-xs mb-1 text-muted">Day of Week</Label>
          <select 
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-foreground"
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
          >
            {DAYS.map((day, index) => (
              <option key={index} value={index}>{day}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="text-xs mb-1 text-muted">Start Time</Label>
            <Input 
              type="time" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs mb-1 text-muted">End Time</Label>
            <Input 
              type="time" 
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs mb-1 text-muted">Room / Location (Optional)</Label>
          <Input 
            placeholder="e.g. Science Building 302" 
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </div>

        <Button 
          variant="primary" 
          onClick={handleAddRoutine}
          disabled={!startTime || !endTime}
          className="w-full py-3"
        >
          <Plus size={18} className="mr-2" /> Add to Schedule
        </Button>
      </Card>

      <div className="flex-1 overflow-y-auto space-y-3 pb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Weekly Schedule</h3>
        
        {sortedSlots.length === 0 ? (
          <div className="text-center p-6 opacity-70 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm text-muted">No classes scheduled yet. Add your class times above.</p>
          </div>
        ) : (
          sortedSlots.map(slot => (
            <Card key={slot.id} className="flex items-center justify-between p-4">
              <div>
                <h4 className="font-semibold text-foreground text-base mb-1">{DAYS[slot.dayOfWeek]}</h4>
                <div className="flex items-center text-xs text-muted space-x-3">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                  </div>
                  {slot.roomNumber && (
                    <div className="flex items-center">
                      <MapPin size={12} className="mr-1" />
                      <span className="truncate max-w-[100px]">{slot.roomNumber}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="p-2 text-slate-400 hover:text-red-500 rounded-lg shrink-0" 
                onClick={() => handleDeleteRoutine(slot.id)}
              >
                <Trash2 size={18} />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
