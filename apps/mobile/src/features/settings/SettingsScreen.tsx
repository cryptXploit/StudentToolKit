import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@student-os/ui';
import { ArrowLeft, Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { hapticImpact } from '../../lib/haptics';

export function SettingsScreen() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    hapticImpact('light');
    setTheme(newTheme);
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2 flex items-center">
        <Button variant="ghost" className="mr-2 p-2 -ml-2 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">App Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage preferences</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 pb-6">
        <section>
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase mb-3">Appearance</h2>
          <Card className="overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
              onClick={() => handleThemeChange('system')}
            >
              <div className="flex items-center text-foreground">
                <Monitor size={20} className="mr-3 opacity-70" />
                <span className="font-medium">System Default</span>
              </div>
              {theme === 'system' && <Check size={18} className="text-primary" />}
            </div>
            
            <div 
              className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
              onClick={() => handleThemeChange('light')}
            >
              <div className="flex items-center text-foreground">
                <Sun size={20} className="mr-3 opacity-70" />
                <span className="font-medium">Light</span>
              </div>
              {theme === 'light' && <Check size={18} className="text-primary" />}
            </div>

            <div 
              className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
              onClick={() => handleThemeChange('dark')}
            >
              <div className="flex items-center text-foreground">
                <Moon size={20} className="mr-3 opacity-70" />
                <span className="font-medium">Dark</span>
              </div>
              {theme === 'dark' && <Check size={18} className="text-primary" />}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
