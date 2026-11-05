import Link from 'next/link';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <main>
      <header className="site">
        <div className="inner">
          <Link href="/" className="brand">Portfolio Management System</Link>
        </div>
      </header>
      <div className="container">
        <h1>Admin login</h1>
        <LoginForm />
      </div>
    </main>
  );
}
