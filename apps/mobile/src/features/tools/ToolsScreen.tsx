import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, CheckSquare } from 'lucide-react';
import { showToolsBanner, hideToolsBanner } from '../../lib/ads';
import { Card } from '@student-os/ui';

export function ToolsScreen() {
  const tools = [
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
      path: '/tools/attendance', // Placeholder for next phase
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30'
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
        <p className="text-muted text-sm mt-1">Calculators and decision engines.</p>
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
                  <p className="text-sm text-muted mt-0.5">{tool.description}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
