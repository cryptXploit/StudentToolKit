import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Calculator, Calendar, User } from 'lucide-react';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { ToolsScreen } from './features/tools/ToolsScreen';
import { TargetGPAScreen } from './features/tools/TargetGPAScreen';
import { AttendanceScreen } from './features/tools/AttendanceScreen';
import { HomeScreen } from './features/dashboard/HomeScreen';
import { PlannerScreen } from './features/planner/PlannerScreen';

function Navigation() {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/tools', icon: Calculator, label: 'Tools' },
    { path: '/planner', icon: Calendar, label: 'Planner' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-card border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link className="flex flex-col items-center justify-center w-full h-full" key={item.path} to={item.path}>
              <Icon className={isActive ? 'text-primary' : 'text-muted'} size={24} />
              <span className={`text-xs mt-1 ${isActive ? 'text-primary font-medium' : 'text-muted'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}



export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <main className="flex-1 overflow-y-auto pb-16">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/tools" element={<ToolsScreen />} />
            <Route path="/tools/target-gpa" element={<TargetGPAScreen />} />
            <Route path="/tools/attendance" element={<AttendanceScreen />} />
            <Route path="/planner" element={<PlannerScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Routes>
        </main>
        <Navigation />
      </div>
    </BrowserRouter>
  );
}
