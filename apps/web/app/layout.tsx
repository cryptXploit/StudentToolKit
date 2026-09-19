import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL('https://prepia.app'),
  title: 'Student OS | Less guessing. More clarity.',
  description: 'The offline-first academic decision engine. Calculate your Target CGPA, manage attendance, and track deadlines instantly.',
  openGraph: {
    title: 'Student OS | Less guessing. More clarity.',
    description: 'The offline-first academic decision engine.',
    url: 'https://prepia.app',
    siteName: 'Student OS',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student OS | Academic Decision Engine',
    description: 'Calculate your Target CGPA, manage attendance, and track deadlines instantly—without an internet connection.',
  },
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
