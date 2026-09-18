import Link from 'next/link';
import { Target, CheckSquare } from 'lucide-react';

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-6 mt-10">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Less guessing. More clarity.</h1>
        <p className="text-lg text-muted">The offline-first toolkit for everyday academic decisions. Try our free web tools below, or download the app for the full experience.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <Link className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow flex items-start" href="/tools/target-cgpa">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl mr-4"><Target size={24} /></div>
          <div>
            <h2 className="font-semibold text-lg mb-1">Target CGPA Calculator</h2>
            <p className="text-muted text-sm">Find out exactly what you need in your remaining credits to hit your goal.</p>
          </div>
        </Link>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 opacity-60 flex items-start cursor-not-allowed">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl mr-4"><CheckSquare size={24} /></div>
          <div>
            <h2 className="font-semibold text-lg mb-1">Attendance Engine</h2>
            <p className="text-muted text-sm">Available exclusively in the mobile app.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
