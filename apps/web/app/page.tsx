import Link from 'next/link';
import { Shield, Zap, Brain, ArrowRight, Download } from 'lucide-react';

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 sm:py-24">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
          Less guessing.<br className="hidden sm:block" /> More clarity.
        </h1>
        <p className="text-xl text-slate-600 mb-10 leading-relaxed">
          The offline-first academic decision engine. Calculate your Target CGPA, manage your attendance, and track your deadlines instantly—without an internet connection.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="#" 
            className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center"
          >
            <Download className="mr-2" size={20} />
            Download for Android
          </Link>
          <Link 
            href="/tools/target-cgpa" 
            className="w-full sm:w-auto bg-slate-100 text-slate-900 px-8 py-4 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center border border-slate-200"
          >
            Use Web Calculators
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto mb-24">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
            <Shield size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Offline First</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            Your academic data never leaves your device. Everything runs locally, ensuring ultimate privacy and speed.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-blue-600">
            <Brain size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Context Aware</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            Set your target CGPA once, and the app intelligently pre-fills your context across all calculators automatically.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-violet-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-violet-600">
            <Zap size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Instant Clarity</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            Zero loading spinners. Every calculation happens instantly as you type, driven by our pure math engine.
          </p>
        </div>
      </div>
    </main>
  );
}
