import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student OS | Offline Academic Toolkit",
  description: "Calculate CGPA, track attendance, and plan your semester. Download the offline-first app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="border-b border-slate-200 bg-white p-4 flex justify-between items-center max-w-5xl mx-auto">
          <div className="font-bold text-xl text-primary">Student OS</div>
          <button className="bg-foreground text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
            Download App
          </button>
        </nav>
        {children}
      </body>
    </html>
  );
}
