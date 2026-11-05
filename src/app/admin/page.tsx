import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySessionValue, SESSION_COOKIE } from '@/lib/auth';
import AdminDashboard from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const store = await cookies();
  const user = verifySessionValue(store.get(SESSION_COOKIE)?.value);
  if (!user) redirect('/admin/login');

  return (
    <main>
      <header className="site">
        <div className="inner">
          <Link href="/" className="brand">Portfolio Management System</Link>
          <span className="muted">Signed in as {user}</span>
        </div>
      </header>
      <div className="container">
        <AdminDashboard />
      </div>
    </main>
  );
}
