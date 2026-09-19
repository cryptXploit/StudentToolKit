import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Link href="/" className="text-primary hover:underline text-sm font-medium">
          &larr; Back to Home
        </Link>
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight mb-8">Privacy Policy for Student OS</h1>
      
      <div className="space-y-6 text-slate-600 leading-relaxed">
        <p>
          Last updated: September 2026
        </p>
        
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">1. Offline-First Architecture</h2>
          <p>
            Student OS is built on a strict "Offline-First" philosophy. We believe that your academic data—including your grades, CGPA, university name, department, attendance records, and schedule—belongs exclusively to you.
          </p>
          <p className="mt-3">
            All academic data you enter into Student OS is stored securely and entirely locally on your own device using local storage databases (IndexedDB/SQLite). <strong>We do not transmit, collect, or store your personal academic data on any external servers.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">2. Device APIs and Permissions</h2>
          <p>
            To provide a native and premium experience, Student OS utilizes certain device-level APIs:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2">
            <li><strong>Local Notifications:</strong> Used strictly to remind you of upcoming academic events you have scheduled. These are scheduled locally and do not rely on push notification servers.</li>
            <li><strong>Haptic Feedback:</strong> Used to provide tactile physical responses when interacting with the app.</li>
            <li><strong>Local Storage:</strong> Used to save your settings and academic snapshot context locally.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">3. Analytics and Advertising</h2>
          <p>
            To support the ongoing development of this free utility, we may display standard, non-personalized advertisements via Google AdMob. These services may collect basic, non-identifying telemetry (such as crash reports or generic usage statistics) according to their respective privacy policies, but they <strong>do not have access to your private academic data.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">4. Data Export and Deletion</h2>
          <p>
            Because your data lives only on your device, you have complete control over it. You can export your data to a secure file at any time using the "Data Vault" in your Profile screen. To permanently delete all your data, simply uninstall the application or clear its local data through your device settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or the offline-first nature of Student OS, please contact us at support@studentos.app.
          </p>
        </section>
      </div>
    </main>
  );
}
