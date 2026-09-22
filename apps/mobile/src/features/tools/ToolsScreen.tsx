import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, CheckSquare, Calculator, Layers, Calendar, HelpCircle, FileText, UserMinus, Timer, ArrowLeftRight } from 'lucide-react';
import { showToolsBanner, hideToolsBanner } from '../../lib/ads';
import { Card } from '@student-os/ui';

export function ToolsScreen() {
  const tools: Array<{ id: string; title: string; description: string; icon: any; path: string; color: string; bg: string; disabled?: boolean }> = [
    {
      id: 'vault',
      title: 'Document Vault',
      description: 'Manage all offline academic files',
      icon: FileText,
      path: '/tools/vault',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30'
    },
    {
      id: 'cumulative-cgpa',
      title: 'Cumulative CGPA',
      description: 'Combine past semesters to find your overall CGPA.',
      icon: Layers,
      path: '/tools/cumulative-cgpa',
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/30'
    },
    {
      id: 'semester-gpa',
      title: 'Semester GPA',
      description: 'Quickly calculate your GPA for a single semester.',
      icon: Calculator,
      path: '/tools/semester-gpa',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30'
    },
    {
      id: 'target-gpa',
      title: 'Target CGPA Calculator',
      description: 'Find out exactly what you need in your remaining credits.',
      icon: Target,
      path: '/tools/target-cgpa',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30'
    },
    {
      id: 'attendance',
      title: 'Attendance Engine',
      description: 'Can you safely miss the next class?',
      icon: CheckSquare,
      path: '/tools/attendance',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30'
    },
    {
      id: 'timetable',
      title: 'Timetable Builder',
      description: 'Visually organize your weekly classes.',
      icon: Calendar,
      path: '/tools/timetable',
      color: 'text-pink-500',
      bg: 'bg-pink-50 dark:bg-pink-950/30'
    },
      {
        id: 'calculator',
        title: 'Scientific Calculator',
        description: 'Standard and basic scientific operations.',
        icon: Calculator,
        path: '/tools/calculator',
        color: 'text-teal-500',
        bg: 'bg-teal-50 dark:bg-teal-950/30'
      },
      {
        id: 'pomodoro',
        title: 'Pomodoro Timer',
        description: 'Deep work and study sessions.',
        icon: Timer,
        path: '/tools/pomodoro',
        color: 'text-indigo-500',
        bg: 'bg-indigo-50 dark:bg-indigo-950/30'
      },
      {
        id: 'converter',
        title: 'Unit Converter',
        description: 'Length, weight, and temperature.',
        icon: ArrowLeftRight,
        path: '/tools/converter',
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/30'
      },
      {
        id: 'bunk-planner',
        title: 'Bunk Planner',
        description: 'Simulate absences and test attendance limits.',
        icon: UserMinus,
        path: '/tools/bunk-planner',
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-950/30'
      },
    {
      id: 'what-if',
      title: 'Academic What-If',
      description: 'Simulate scenarios and dropped courses.',
      icon: HelpCircle,
      path: '/tools/what-if',
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30'
    }
  ];

  useEffect(() => {
    showToolsBanner();
    return () => {
      hideToolsBanner();
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Student Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">Calculators and everyday utilities.</p>
      </header>
      
      <div className="grid gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const CardContent = (
            <Card className={`flex items-center p-4`}>
              <div className={`p-3 rounded-xl mr-4 ${tool.bg}`}>
                <Icon className={tool.color} size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{tool.title}</h3>
                  {tool.disabled && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{tool.description}</p>
              </div>
            </Card>
          );

          

          return (
            <Link key={tool.id} to={tool.path} className="active:scale-[0.98] transition-transform block">
              {CardContent}
            </Link>
          );
        })}
      </div>
      
      {/* Reserved space for AdMob Banner to prevent CLS */}
      <div className="min-h-[60px] w-full flex items-center justify-center mt-6 mb-6"></div>
    </div>
  );
}











