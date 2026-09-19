import { useState, useMemo } from 'react';
import { calculateSemesterGPA } from '@student-os/engine';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Card, Input, Button } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';

export function SemesterGPAScreen() {
  const [courses, setCourses] = useState([
    { id: crypto.randomUUID(), name: '', credit: '', grade: '' },
    { id: crypto.randomUUID(), name: '', credit: '', grade: '' },
    { id: crypto.randomUUID(), name: '', credit: '', grade: '' },
    { id: crypto.randomUUID(), name: '', credit: '', grade: '' }
  ]);

  const { gpa, totalCredits } = useMemo(() => {
    let validCredits = 0;
    const validCourses = courses
      .map(c => {
        const cred = parseFloat(c.credit);
        const grade = parseFloat(c.grade);
        return { cred, grade };
      })
      .filter(c => !isNaN(c.cred) && c.cred > 0 && !isNaN(c.grade));

    const records = validCourses.map(c => {
      validCredits += c.cred;
      return { credits: c.cred, gradePoint: c.grade };
    });

    try {
      const calcGPA = calculateSemesterGPA(records);
      return { gpa: calcGPA, totalCredits: validCredits };
    } catch (e) {
      return { gpa: 0, totalCredits: validCredits };
    }
  }, [courses]);

  const addCourse = () => {
    hapticImpact('light');
    setCourses([...courses, { id: crypto.randomUUID(), name: '', credit: '', grade: '' }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      hapticImpact('medium');
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: 'name' | 'credit' | 'grade', value: string) => {
    setCourses(courses.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-full">
      <header className="mb-6 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Semester GPA</h1>
          <p className="text-muted text-sm">Quick calculation</p>
        </div>
      </header>

      <Card className="mb-6 p-5 border-l-4 border-l-primary flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted mb-1">Semester GPA</h2>
          <div className="text-4xl font-bold text-primary">{gpa.toFixed(2)}</div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Total Credits</p>
          <div className="text-2xl font-semibold text-foreground">{totalCredits}</div>
        </div>
      </Card>

      <div className="space-y-3 flex-1 overflow-y-auto pb-6">
        <div className="flex px-1 text-xs font-medium text-muted uppercase tracking-wider mb-2">
          <div className="flex-[2] mr-2">Course (Opt)</div>
          <div className="flex-1 mr-2">Credits</div>
          <div className="flex-1 mr-12">Grade</div>
        </div>
        
        {courses.map((course) => (
          <div key={course.id} className="flex items-center gap-2">
            <div className="flex-[2]">
              <Input
                type="text"
                placeholder="Name"
                value={course.name}
                onChange={e => updateCourse(course.id, 'name', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min="0" step="0.5"
                placeholder="Cr"
                value={course.credit}
                onChange={e => updateCourse(course.id, 'credit', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min="0" max="10" step="0.01"
                placeholder="GPA"
                value={course.grade}
                onChange={e => updateCourse(course.id, 'grade', e.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              className="p-2 h-10 w-10 shrink-0 text-slate-400 hover:text-red-500"
              onClick={() => removeCourse(course.id)}
              disabled={courses.length <= 1}
            >
              <Trash2 size={18} />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button variant="secondary" onClick={addCourse} className="w-full py-3">
          <Plus className="mr-2" size={18} /> Add Course
        </Button>
      </div>
    </div>
  );
}
