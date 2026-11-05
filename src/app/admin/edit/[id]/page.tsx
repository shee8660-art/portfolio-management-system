import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySessionValue, SESSION_COOKIE } from '@/lib/auth';
import ProfileEditor from '@/components/ProfileEditor';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProfilePage({ params }: PageProps) {
  const store = await cookies();
  const user = verifySessionValue(store.get(SESSION_COOKIE)?.value);
  if (!user) redirect('/admin/login');
  const { id } = await params;

  return (
    <main>
      <header className="site">
        <div className="inner">
          <Link href="/admin" className="brand">Portfolio Management System</Link>
          <span className="muted">Signed in as {user}</span>
        </div>
      </header>
      <div className="container">
        <h1>Edit landing page</h1>
        <ProfileEditor id={id} />
      </div>
    </main>
  );
}
