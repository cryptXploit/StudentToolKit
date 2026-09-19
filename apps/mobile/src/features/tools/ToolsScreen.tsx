import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, CheckSquare, Calculator, Layers, FolderLock } from 'lucide-react';
import { showToolsBanner, hideToolsBanner } from '../../lib/ads';
import { Card } from '@student-os/ui';

export function ToolsScreen() {
  const tools = [
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
      title: 'Target CGPA Simulator',
      description: 'Find out exactly what you need in your remaining credits.',
      icon: Target,
      path: '/tools/target-gpa',
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
      id: 'vault',
      title: 'Document Vault',
      description: 'Secure, offline storage for IDs and admit cards.',
      icon: FolderLock,
      path: '/tools/vault',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30'
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
        <h1 className="text-2xl font-bold text-foreground">Utility Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">Calculators and decision engines.</p>
      </header>
      
      <div className="grid gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.id} to={tool.path} className="active:scale-[0.98] transition-transform block">
              <Card className="flex items-center p-4">
                <div className={`p-3 rounded-xl mr-4 ${tool.bg}`}>
                  <Icon className={tool.color} size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{tool.description}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      
      {/* Reserved space for AdMob Banner to prevent CLS */}
      <div className="min-h-[60px] w-full flex items-center justify-center mt-6 mb-6"></div>
    </div>
  );
}
