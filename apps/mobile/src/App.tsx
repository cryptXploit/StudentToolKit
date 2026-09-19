import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';
import { Home, Calculator, Calendar, User } from 'lucide-react';

// Lazy load screens (mapping named exports to default exports for React.lazy)
const HomeScreen = lazy(() => import('./features/dashboard/HomeScreen').then(m => ({ default: m.HomeScreen })));
const ToolsScreen = lazy(() => import('./features/tools/ToolsScreen').then(m => ({ default: m.ToolsScreen })));
const TargetGPAScreen = lazy(() => import('./features/tools/TargetGPAScreen').then(m => ({ default: m.TargetGPAScreen })));
const AttendanceScreen = lazy(() => import('./features/tools/AttendanceScreen').then(m => ({ default: m.AttendanceScreen })));
const SemesterGPAScreen = lazy(() => import('./features/tools/SemesterGPAScreen').then(m => ({ default: m.SemesterGPAScreen })));
const CumulativeCGPAScreen = lazy(() => import('./features/tools/CumulativeCGPAScreen').then(m => ({ default: m.CumulativeCGPAScreen })));
const PlannerScreen = lazy(() => import('./features/planner/PlannerScreen').then(m => ({ default: m.PlannerScreen })));
const ProfileScreen = lazy(() => import('./features/profile/ProfileScreen').then(m => ({ default: m.ProfileScreen })));

function Navigation() {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/tools', icon: Calculator, label: 'Tools' },
    { path: '/planner', icon: Calendar, label: 'Planner' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-card border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link className="flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform" key={item.path} to={item.path}>
              <Icon className={isActive ? 'text-primary' : 'text-muted'} size={24} />
              <span className={`text-[10px] mt-1 ${isActive ? 'text-primary font-medium' : 'text-muted'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Simple fallback for Suspense
const ScreenLoader = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function AppRouterContent() {
  useAndroidBackButton();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background pt-safe">
      <main className="flex-1 overflow-y-auto pb-20 relative">
        <GlobalErrorBoundary>
          <Suspense fallback={<ScreenLoader />}>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/tools" element={<ToolsScreen />} />
              <Route path="/tools/target-gpa" element={<TargetGPAScreen />} />
              <Route path="/tools/semester-gpa" element={<SemesterGPAScreen />} />
              <Route path="/tools/cumulative-cgpa" element={<CumulativeCGPAScreen />} />
              <Route path="/tools/attendance" element={<AttendanceScreen />} />
              <Route path="/planner" element={<PlannerScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Routes>
          </Suspense>
        </GlobalErrorBoundary>
      </main>
      <Navigation />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouterContent />
    </BrowserRouter>
  );
}
